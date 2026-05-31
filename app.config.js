// Dynamic Expo config. Keeps everything from app.json, but injects a web
// `baseUrl` when PAGES_BASE_URL is set (used by the GitHub Pages CI build, e.g.
// "/SplitExpense"). Local and native builds leave it unset and serve from root.
export default ({ config }) => {
  const baseUrl = process.env.PAGES_BASE_URL;
  return {
    ...config,
    experiments: {
      ...config.experiments,
      ...(baseUrl ? { baseUrl } : {}),
    },
  };
};
