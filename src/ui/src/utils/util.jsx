/** 상대적인 시간 계산 함수 */
const getRelativeTime = (pubDate) => {
    const now = new Date();
    const published = new Date(pubDate);
    const diffMs = now - published;  // 밀리초 차이
  
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
  
    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

export default getRelativeTime;