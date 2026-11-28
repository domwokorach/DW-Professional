/** Shared-layout ids; the collapsed card and the expanded dialog use the same ones so motion can morph between them. */
export const cardIds = (projectId: string, uid: string) => ({
  card: `xp-card-${projectId}-${uid}`,
  image: `xp-image-${projectId}-${uid}`,
  category: `xp-cat-${projectId}-${uid}`,
  title: `xp-title-${projectId}-${uid}`,
});
