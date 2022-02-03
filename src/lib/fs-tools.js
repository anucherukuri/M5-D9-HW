import fs from "fs-extra" // 3rd party module
import { fileURLToPath } from "url"
import { join, dirname } from "path"


const { readJSON, writeJSON, writeFile, createReadStream } = fs

const dataFolderPath = join(dirname(fileURLToPath(import.meta.url)), "../data")
const authorsPublicFolderPath = join(process.cwd(), "./public/img/users")

const blogPostsJSONPath = join(dataFolderPath, "blogs.json")
const authorsJSONPath = join(dataFolderPath, "authors.json")

export const getBlogPosts = () => readJSON(blogPostsJSONPath)
export const writeBlogPosts = content => writeJSON(blogPostsJSONPath, content)
export const getAuthors = () => readJSON(usersJSONPath)
export const writeAuthors = content => writeJSON(authorsJSONPath, content)

export const saveUsersAvatars = (filename, contentAsABuffer) => writeFile(join(authorsPublicFolderPath, filename), contentAsABuffer)

export const getBlogPostsReadableStream = () => createReadStream(blogPostsJSONPath)
