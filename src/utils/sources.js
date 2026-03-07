const SOURCE_KEY = 'caleta_user_sources'

export const getSource = () => {
  const data = localStorage.getItem(SOURCE_KEY)
  return data ? JSON.parse(data) : ['Overview']
}

export const addSource = (sourceName) => {
  const sources = getSource()

  if (!sources.includes(sourceName)) {
    sources.push(sourceName)
    localStorage.setItem(SOURCE_KEY, JSON.stringify(sources))
  }

  return sources
}