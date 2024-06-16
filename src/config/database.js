const config = 
  process.env.NODE_ENV === "homolog" ? {
    POSTGRES_USER: "u203vrjb817tgm",
    POSTGRES_HOST: "c97r84s7psuajm.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com",
    POSTGRES_DB: "d6nofbvj2rl40d",
  } : {
    POSTGRES_USER: "",
    POSTGRES_HOST: "",
    POSTGRES_DB: "",
    POSTGRES_PASSWORD: "",
  }


module.exports = { config }