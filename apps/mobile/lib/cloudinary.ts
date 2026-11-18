// The website's Cloudinary account only serves the exact transformations the site uses (`f_auto,q_auto`, and `f_jpg,q_auto`
// for the HEIC photo); any other (e.g. a width cap) returns 401. So the data modules' URLs are used unchanged.

/** The cinematic Achievements background video, same asset as the website (AchievementsVideo.tsx), without `f_auto`. */
export const ACHIEVEMENTS_VIDEO = 'https://res.cloudinary.com/dkkuwmr42/video/upload/v1791742538/london-walking_jer4pf.mp4';
