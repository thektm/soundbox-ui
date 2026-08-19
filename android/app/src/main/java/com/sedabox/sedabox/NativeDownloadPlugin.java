package com.sedabox.sedabox;

import android.Manifest;
import android.app.DownloadManager;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "NativeDownload",
    permissions = {
        @Permission(
            alias = "legacyStorage",
            strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }
        )
    }
)
public class NativeDownloadPlugin extends Plugin {
    private static final long POLL_INTERVAL_MS = 250L;

    @PluginMethod
    public void downloadFile(PluginCall call) {
        // Android 10+ can write app-created DownloadManager files to public
        // Downloads without broad storage permission. Only legacy Android needs it.
        if (
            Build.VERSION.SDK_INT < Build.VERSION_CODES.Q &&
            getPermissionState("legacyStorage") != PermissionState.GRANTED
        ) {
            requestPermissionForAlias("legacyStorage", call, "legacyStoragePermissionCallback");
            return;
        }
        beginDownload(call);
    }

    @PermissionCallback
    private void legacyStoragePermissionCallback(PluginCall call) {
        if (getPermissionState("legacyStorage") == PermissionState.GRANTED) {
            beginDownload(call);
        } else {
            call.reject("Storage permission is required to save this download.", "DOWNLOAD_PERMISSION_DENIED");
        }
    }

    private void beginDownload(PluginCall call) {
        final String url = call.getString("url");
        final String fallbackUrl = call.getString("fallbackUrl");
        final String requestedFilename = call.getString("filename", "sedabox-download.mp3");
        final String mimeType = call.getString("mimeType", "audio/mpeg");
        final String authorization = call.getString("authorization");

        if (!isHttpUrl(url)) {
            call.reject("A valid HTTP download URL is required.", "DOWNLOAD_INVALID_URL");
            return;
        }

        final String filename = sanitizeFilename(requestedFilename);
        final DownloadManager manager =
            (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        if (manager == null) {
            call.reject("Android download service is unavailable.", "DOWNLOAD_SERVICE_UNAVAILABLE");
            return;
        }

        new Thread(() -> {
            try {
                DownloadResult result;
                try {
                    result = runAttemptWithDuplicateRetry(
                        manager,
                        url,
                        filename,
                        mimeType,
                        null
                    );
                } catch (DownloadFailure primaryFailure) {
                    if (!isHttpUrl(fallbackUrl)) throw primaryFailure;
                    result = runAttemptWithDuplicateRetry(
                        manager,
                        fallbackUrl,
                        filename,
                        mimeType,
                        authorization
                    );
                }

                JSObject ret = new JSObject();
                ret.put("downloadId", result.downloadId);
                ret.put("filename", result.filename);
                if (result.uri != null) ret.put("uri", result.uri.toString());
                call.resolve(ret);
            } catch (DownloadFailure failure) {
                call.reject(
                    "Android download failed (reason " + failure.reason + ").",
                    "NATIVE_DOWNLOAD_FAILED"
                );
            } catch (SecurityException securityException) {
                call.reject(
                    "Android could not write the downloaded file.",
                    "DOWNLOAD_STORAGE_DENIED",
                    securityException
                );
            } catch (Exception exception) {
                call.reject(
                    exception.getMessage() != null ? exception.getMessage() : "Android download failed.",
                    "NATIVE_DOWNLOAD_FAILED",
                    exception
                );
            }
        }, "sedabox-native-download").start();
    }

    private DownloadResult runAttemptWithDuplicateRetry(
        DownloadManager manager,
        String url,
        String filename,
        String mimeType,
        String authorization
    ) throws Exception {
        try {
            return runAttempt(manager, url, filename, mimeType, authorization);
        } catch (DownloadFailure failure) {
            if (failure.reason != DownloadManager.ERROR_FILE_ALREADY_EXISTS) throw failure;
            return runAttempt(
                manager,
                url,
                withUniqueSuffix(filename),
                mimeType,
                authorization
            );
        }
    }

    private DownloadResult runAttempt(
        DownloadManager manager,
        String url,
        String filename,
        String mimeType,
        String authorization
    ) throws Exception {
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle(filename);
        request.setDescription("Sedabox");
        request.setMimeType(mimeType);
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(true);
        request.setNotificationVisibility(
            DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
        );
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
        request.addRequestHeader("Accept", "application/octet-stream");
        if (authorization != null && !authorization.trim().isEmpty()) {
            request.addRequestHeader("Authorization", authorization);
        }

        long downloadId = manager.enqueue(request);
        try {
            while (true) {
                DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
                try (Cursor cursor = manager.query(query)) {
                    if (cursor == null || !cursor.moveToFirst()) {
                        throw new DownloadFailure(DownloadManager.ERROR_UNKNOWN);
                    }

                    int status = cursor.getInt(
                        cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)
                    );
                    long loaded = cursor.getLong(
                        cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
                    );
                    long total = cursor.getLong(
                        cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
                    );
                    emitProgress(downloadId, loaded, total);

                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        return new DownloadResult(
                            downloadId,
                            filename,
                            manager.getUriForDownloadedFile(downloadId)
                        );
                    }
                    if (status == DownloadManager.STATUS_FAILED) {
                        int reason = cursor.getInt(
                            cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON)
                        );
                        manager.remove(downloadId);
                        throw new DownloadFailure(reason);
                    }
                }

                Thread.sleep(POLL_INTERVAL_MS);
            }
        } catch (InterruptedException interrupted) {
            manager.remove(downloadId);
            Thread.currentThread().interrupt();
            throw interrupted;
        }
    }

    private void emitProgress(long downloadId, long loadedBytes, long totalBytes) {
        JSObject progress = new JSObject();
        progress.put("downloadId", downloadId);
        progress.put("bytes", Math.max(0L, loadedBytes));
        progress.put("totalBytes", totalBytes > 0L ? totalBytes : -1L);
        notifyListeners("progress", progress);
    }

    private static boolean isHttpUrl(String value) {
        if (value == null || value.trim().isEmpty()) return false;
        try {
            Uri uri = Uri.parse(value);
            String scheme = uri.getScheme();
            return "http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme);
        } catch (Exception ignored) {
            return false;
        }
    }

    private static String sanitizeFilename(String value) {
        String cleaned = value == null ? "" : value
            .replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_")
            .trim();
        return cleaned.isEmpty() ? "sedabox-download.mp3" : cleaned;
    }

    private static String withUniqueSuffix(String filename) {
        int dot = filename.lastIndexOf('.');
        String suffix = "-" + System.currentTimeMillis();
        if (dot > 0 && dot < filename.length() - 1) {
            return filename.substring(0, dot) + suffix + filename.substring(dot);
        }
        return filename + suffix;
    }

    private static final class DownloadResult {
        final long downloadId;
        final String filename;
        final Uri uri;

        DownloadResult(long downloadId, String filename, Uri uri) {
            this.downloadId = downloadId;
            this.filename = filename;
            this.uri = uri;
        }
    }

    private static final class DownloadFailure extends Exception {
        final int reason;

        DownloadFailure(int reason) {
            super("DownloadManager failure: " + reason);
            this.reason = reason;
        }
    }
}
