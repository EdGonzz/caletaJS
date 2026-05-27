const getHash = () => {
  const hash = location.hash.slice(1).toLowerCase() || '/';
  return hash.split('/').filter(Boolean);
};

export default getHash;
