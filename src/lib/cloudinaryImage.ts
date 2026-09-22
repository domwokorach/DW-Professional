export function cloudinaryImageUrl(source: string, width: number): string {
  return source.replace(
    "/image/upload/",
    `/image/upload/c_limit,w_${width}/f_auto/q_auto/`,
  );
}
