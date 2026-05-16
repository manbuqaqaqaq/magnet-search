export default {
  port: process.env.PORT || 3001,
  pageSize: 20,
  sourceTimeout: 8000,
  // 访问密钥：设为空字符串则无需认证，设值则在公网访问时必须携带 ?token=xxx
  accessToken: process.env.ACCESS_TOKEN || "",
  sources: [
    {
      name: "tpb",
      enabled: true,
      module: "./tpb.js",
    },
    {
      name: "hiddenbay",
      enabled: true,
      module: "./hiddenbay.js",
    },
    {
      name: "torrentz2",
      enabled: true,
      module: "./torrentz2.js",
    },
    {
      name: "rutor",
      enabled: true,
      module: "./rutor.js",
    },
    {
      name: "knaben",
      enabled: true,
      module: "./knaben.js",
    },
    {
      name: "nyaa",
      enabled: true,
      module: "./nyaa.js",
    },
    {
      name: "glodls",
      enabled: true,
      module: "./glodls.js",
    },
    {
      name: "dmhy",
      enabled: true,
      module: "./dmhy.js",
    },
    {
      name: "btdig",
      enabled: true,
      module: "./btdig.js",
    },
    {
      name: "bitsearch",
      enabled: true,
      module: "./bitsearch.js",
    },
    {
      name: "kittyspdy",
      enabled: false,
      module: "./kittyspdy.js",
    },
    {
      name: "builtin",
      enabled: false,
      module: "./builtin.js",
    },
  ],
};
