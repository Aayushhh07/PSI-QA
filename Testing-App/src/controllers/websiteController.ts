import { Request, Response } from 'express';
import { TestService } from '../services/testService';
import { ApiResponse, Website } from '../types';
import { logger } from '../utils/logger';

export class WebsiteController {
  private testService: TestService;

  constructor() {
    this.testService = new TestService();
  }

  async getAllWebsites(req: Request, res: Response): Promise<void> {
    try {
      const websites = this.testService.getWebsites();

      const response: ApiResponse = {
        success: true,
        data: websites
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Error getting websites: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get websites'
      } as ApiResponse);
    }
  }

  async getWebsite(req: Request, res: Response): Promise<void> {
    try {
      const { websiteId } = req.params;

      const websites = this.testService.getWebsites();
      const website = websites.find(w => w.id === websiteId);

      if (!website) {
        res.status(404).json({
          success: false,
          error: 'Website not found'
        } as ApiResponse);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: website
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Error getting website: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get website'
      } as ApiResponse);
    }
  }

  async addWebsite(req: Request, res: Response): Promise<void> {
    try {
      const { name, baseUrl, description } = req.body;

      // Validate required fields
      if (!name || !baseUrl) {
        res.status(400).json({
          success: false,
          error: 'name and baseUrl are required'
        } as ApiResponse);
        return;
      }

      // Validate URL format
      try {
        new URL(baseUrl);
      } catch {
        res.status(400).json({
          success: false,
          error: 'Invalid URL format'
        } as ApiResponse);
        return;
      }

      const websiteData = {
        name,
        baseUrl,
        description
      };

      const website = this.testService.addWebsite(websiteData);

      const response: ApiResponse = {
        success: true,
        data: website,
        message: 'Website added successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error(`Error adding website: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to add website'
      } as ApiResponse);
    }
  }

  async getWebsiteRoutes(req: Request, res: Response): Promise<void> {
    try {
      const { websiteId } = req.params;

      const routes = this.testService.getRoutes(websiteId);

      const response: ApiResponse = {
        success: true,
        data: routes
      };

      res.status(200).json(response);
    } catch (error) {
      logger.error(`Error getting website routes: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get website routes'
      } as ApiResponse);
    }
  }

  async addWebsiteRoute(req: Request, res: Response): Promise<void> {
    try {
      const { websiteId } = req.params;
      const { path, method, name, description, expectedStatus, timeout, screenshot } = req.body;

      // Validate required fields
      if (!path || !method || !name) {
        res.status(400).json({
          success: false,
          error: 'path, method, and name are required'
        } as ApiResponse);
        return;
      }

      // Validate method
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      if (!validMethods.includes(method)) {
        res.status(400).json({
          success: false,
          error: 'Invalid HTTP method'
        } as ApiResponse);
        return;
      }

      const routeData = {
        websiteId,
        path,
        method,
        name,
        description,
        expectedStatus,
        timeout,
        screenshot
      };

      const route = this.testService.addRoute(routeData);

      const response: ApiResponse = {
        success: true,
        data: route,
        message: 'Route added successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error(`Error adding website route: ${error}`);
      res.status(500).json({
        success: false,
        error: 'Failed to add website route'
      } as ApiResponse);
    }
  }
} 