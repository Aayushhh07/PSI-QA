import { Router } from 'express';
import { WebsiteController } from '../controllers/websiteController';

const router = Router();
const websiteController = new WebsiteController();

// Get all websites
router.get('/', websiteController.getAllWebsites.bind(websiteController));

// Get a specific website
router.get('/:websiteId', websiteController.getWebsite.bind(websiteController));

// Add a new website
router.post('/', websiteController.addWebsite.bind(websiteController));

// Get all routes for a specific website
router.get('/:websiteId/routes', websiteController.getWebsiteRoutes.bind(websiteController));

// Add a new route to a website
router.post('/:websiteId/routes', websiteController.addWebsiteRoute.bind(websiteController));

export { router as websiteRoutes }; 