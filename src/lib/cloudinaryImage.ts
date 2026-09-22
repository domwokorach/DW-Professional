export function cloudinaryImageUrl(source: string, width: number): string {
  return source.replace(
    "/image/upload/",
    `/image/upload/f_auto,q_auto,c_limit,w_${width}/`,
  );
}
