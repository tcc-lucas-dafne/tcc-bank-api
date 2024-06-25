let config;
if (process.env.NODE_ENV === "homolog") {
  config = {
    POSTGRES_USER: "u203vrjb817tgm",
    POSTGRES_HOST: "c97r84s7psuajm.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com",
    POSTGRES_DB: "d6nofbvj2rl40d",
  }
} else if (process.env.NODE_ENV === "prod") {
  config = {
    POSTGRES_USER: "",
    POSTGRES_HOST: "",
    POSTGRES_DB: "",
    POSTGRES_PASSWORD: "",
  }
} else {
  config = {
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
  }
}


module.exports = { config }