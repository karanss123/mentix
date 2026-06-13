import { protect, permitRoles } from "./roleMiddleware.js";

// Combined middleware: protect + role check
const shopkeeperOrAdmin = [protect, permitRoles(["shopkeeper", "admin"])];

export default shopkeeperOrAdmin;
