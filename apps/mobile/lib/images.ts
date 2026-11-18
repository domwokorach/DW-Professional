// Local copies of the website's public/ images. Keys match the website data's `/projects/<name>.webp` and `/certifications/<name>.webp` paths.

export const localImages: Record<string, number> = {
  '/projects/air-quality-weather-forecasting.webp': require('../assets/images/projects/air-quality-weather-forecasting.webp'),
  '/projects/azure-devops-dashboard.webp': require('../assets/images/projects/azure-devops-dashboard.webp'),
  '/projects/british-streaming.webp': require('../assets/images/projects/british-streaming.webp'),
  '/projects/piggy-bank.webp': require('../assets/images/projects/piggy-bank.webp'),
  '/projects/the-daily-wire.webp': require('../assets/images/projects/the-daily-wire.webp'),
  '/projects/workspace-teams.webp': require('../assets/images/projects/workspace-teams.webp'),
  '/certifications/angular_intermediate.webp': require('../assets/images/certifications/angular_intermediate.webp'),
  '/certifications/c_sharp_basic.webp': require('../assets/images/certifications/c_sharp_basic.webp'),
  '/certifications/frontend_developer_react.webp': require('../assets/images/certifications/frontend_developer_react.webp'),
  '/certifications/golang_basic.webp': require('../assets/images/certifications/golang_basic.webp'),
  '/certifications/java_basic.webp': require('../assets/images/certifications/java_basic.webp'),
  '/certifications/javascript_intermediate.webp': require('../assets/images/certifications/javascript_intermediate.webp'),
  '/certifications/nodejs_basic.webp': require('../assets/images/certifications/nodejs_basic.webp'),
  '/certifications/problem_solving_basic.webp': require('../assets/images/certifications/problem_solving_basic.webp'),
  '/certifications/react_basic.webp': require('../assets/images/certifications/react_basic.webp'),
  '/certifications/rest_api_intermediate.webp': require('../assets/images/certifications/rest_api_intermediate.webp'),
  '/certifications/software_engineer.webp': require('../assets/images/certifications/software_engineer.webp'),
  '/certifications/software_engineer_intern.webp': require('../assets/images/certifications/software_engineer_intern.webp'),
  '/certifications/sql_basic.webp': require('../assets/images/certifications/sql_basic.webp'),
};

/** Full-body character render (500×941): the head area is cut out; the head boxes below sit on it. */
export const heroBody: number = require('../assets/images/character/body.webp');

/** Head crops with the website's collar/edge mask baked into their alpha (scripts/bake-hero-heads.mjs). */
export const heroHeads: Record<'centre' | 'upLeft' | 'up' | 'upRight' | 'left' | 'right' | 'downLeft' | 'down' | 'downRight', number> = {
  centre: require('../assets/images/face/head-centre.webp'),
  upLeft: require('../assets/images/face/head-upLeft.webp'),
  up: require('../assets/images/face/head-up.webp'),
  upRight: require('../assets/images/face/head-upRight.webp'),
  left: require('../assets/images/face/head-left.webp'),
  right: require('../assets/images/face/head-right.webp'),
  downLeft: require('../assets/images/face/head-downLeft.webp'),
  down: require('../assets/images/face/head-down.webp'),
  downRight: require('../assets/images/face/head-downRight.webp'),
};
