import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import documentsRouter from "./documents";
import applicationsRouter from "./applications";
import generatedDocsRouter from "./generatedDocs";
import dashboardRouter from "./dashboard";
import openaiRouter from "./openai/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(documentsRouter);
router.use(applicationsRouter);
router.use(generatedDocsRouter);
router.use(dashboardRouter);
router.use(openaiRouter);

export default router;
