import data from "../../../data/viewer/assets.json";
import { viewerAssetSchema } from "./manifest";
export const viewerAssets = data.map((entry) => viewerAssetSchema.parse(entry));
