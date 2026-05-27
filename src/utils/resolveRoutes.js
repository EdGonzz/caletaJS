const resolveRoutes = (segments) => {
  if (segments.length === 0) return { path: '/', params: {} };

  const route = segments[0];

  if (['about', '404'].includes(route)) return { path: `/${route}`, params: {} };

  if (route === 'coin') return { path: '/coin/:id', params: { id: segments[1] || null } };

  return { path: '/404', params: {} };
};

export default resolveRoutes;
