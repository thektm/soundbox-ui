// The application shell is rendered by pages/_app.tsx for every URL. Keeping a
// second eager import of components/home here caused the complete Home module to
// be downloaded once as the Next page chunk and again through AppRouter's
// dynamic screen chunk. The page component intentionally renders nothing.
export default function Index() {
  return null;
}
