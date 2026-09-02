const matrix={learner:['GET /api/chapters'],teacher:['GET /api/chapters','GET /api/reports/cohort','POST /api/content/review'],admin:['GET /api/chapters','GET /api/reports/cohort','POST /api/content/review','POST /api/rewards/manual'],verifier:['POST /api/rewards/manual']};
export function allowed(role,permission){return (matrix[role]??[]).includes(permission);}
