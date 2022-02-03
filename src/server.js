import express from "express";
import cors from "cors";
import { join } from "path"
import listEndpoints from "express-list-endpoints";
import swaggerUI from "swagger-ui-express"
import authorsRouter from "./services/authors/index.js";
import blogsRouter from "./services/blogs/index.js";
import { badRequestHandler, unauthorizedHandler, notFoundHandler, genericErrorHandler } from "./errorHandlers.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import yamljs from "yamljs";


const server = express();

const { PORT } = process.env;

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

const publicFolderPath = path.join(__dirname, "./public");

const yamlDocument = yamljs.load(join(process.cwd(), "./src/apiDescription.yml"))


// ************************** MIDDLEWARES ********************************

const loggerMiddleware = (req, res, next) => {
  console.log(`Request method: ${req.method} --- URL ${req.url} --- ${new Date()}`)
  next()
}


const whiteListedOrigins = [process.env.FE_DEV_URL, process.env.FE_PROD_URL]

console.log("Permitted origins:")
console.table(whiteListedOrigins)

// const whiteList = ["http://localhost:3001"];
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (whiteList.some((allowedUrl) => allowedUrl === origin)) {
//       callback(null, true);
//     } else {
//       const error = new Error("Not allowed by cors!");
//       error.status = 403;
//       callback(error);
//     }
//   },
// };

server.use(
  cors({
    origin: function (origin, corsNext) {
      console.log("ORIGIN: ", origin)

      if (!origin || whiteListedOrigins.indexOf(origin) !== -1) {
        // GOOD
        corsNext(null, true)
      } else {
        // BAD
        corsNext(new Error("CORS ERROR!"))
      }
    },
  })
)

// server.use(cors(corsOptions));
server.use(express.json());
server.use(loggerMiddleware) // Global middleware
server.use(express.static(publicFolderPath));

// ************************************END POINTS *****************************
server.use("/authors", authorsRouter);
server.use("/blogs", blogsRouter);
server.use("/docs", swaggerUI.serve, swaggerUI.setup(yamlDocument))

// *********************** ERROR HANDLERS ***************************
server.use(badRequestHandler)
server.use(unauthorizedHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)


console.table(listEndpoints(server));

server.listen(PORT, () => console.log("✅ Server is running on port : ", PORT));

server.on("error", (error) =>
  console.log(`❌ Server is not running due to : ${error}`)
);
