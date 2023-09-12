const logger = require('./logger');
var _ = require('lodash');

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
/**
 * finds the author who has written the most blogs in given list and returns an object of the format
 * {
 *  author:'name',
 *  blogs:4
 * }
 *
 * returns null if empty list is given
 */
const mostBlogs = (blogs) => {
    if(blogs.length === 0){
        return null;
    }

    const result = _(blogs)
        .countBy((blog) => blog.author)
        .entries()
        .maxBy(_.last);

    return {
        author:result[0],
        blogs:result[1]
    }
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs
}