# Audio Files

Place your audio files in this directory with the name `music.mp3` or update the `src` property in your song data to point to the correct audio files.

## Supported Formats

- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)

## Example Structure

```
public/
  music.mp3          # Default fallback audio
  audio/
    song1.mp3
    song2.mp3
    ...
```

## Note

The music player currently uses `/music.mp3` as a fallback. To use actual audio:

1. Add your audio files to the `public` folder
2. Update the `src` property in `mockData.ts` songs:

```typescript
{
  id: "s1",
  title: "My Song",
  artist: "Artist Name",
  src: "/audio/mysong.mp3",  // Update this
  // ...
}
```
