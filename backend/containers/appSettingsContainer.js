// backend/containers/appSettingsContainer.js

import AppSettingsRepository from "../repositories/implementation/AppSettingsRepository.js";
import AppSettingsService from "../services/AppSettings/appSettingsService.js";
import AppSettingsController from "../controllers/AppSettings/appSettingsController.js";

const appSettingsRepository = new AppSettingsRepository();
const appSettingsService = new AppSettingsService(appSettingsRepository);
const appSettingsController = new AppSettingsController(appSettingsService);

export { appSettingsController };
