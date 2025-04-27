  
export const getImageUrl = (url) => {
    if (url) return url;

    const dummyCount = 5;
    const randomIndex = Math.floor(Math.random() * dummyCount)+1;
    return `image/placeholders/dummy${randomIndex}.png`;
};
  