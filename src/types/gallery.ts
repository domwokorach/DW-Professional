export type GalleryMedia = {
  type: "image" | "video";
  src: string;
  alt: string;
};

export type GalleryCollection = {
  id: string;
  title: string;
  year: number;
  description: string;
  media: GalleryMedia[];
};
