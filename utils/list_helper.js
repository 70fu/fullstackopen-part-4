const logger = require('./logger');

const dummy = (blogs) => {
    return 1;
}

const totalLikes = (blogs) => {
    return blogs.map((blog) => blog.likes)
        .reduce((sum,likes) => sum + likes,0);
}

/**
 * @param blogs
 * @returns (1st) blog with highest likes of given blogs array, null if an empty array is given
 */
const favoriteBlog = (blogs) => {
    if(blogs.length===0){
        return null;
    }

    const maxLikes = Math.max(...blogs.map((blog) => blog.likes));
    return blogs.find((blog) => blog.likes===maxLikes);
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog
}