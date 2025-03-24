import {
  createService,
  getAllService,
  getByIdService,
  updateService,
} from "../../services/index.js";
import { folderNames } from "../../../utils/constants.js";
import { imgUpload } from "../../../utils/fileHandle.js";
const dbTable = "insurance";
import path from "path";
import { isUUID } from "../../../utils/common.js";

export const createInsuranceController = async (req, res) => {
  try {
    if (!req.body.name || !req.body.vehicle_id || !req.body.purchase_date || !req.body.expired_date)
      return res.status(400).json({ message: "Missing Required Fields" });
    if (!isUUID(req.body.vehicle_id)) return res.status(400).json({ message: "Invalid id" });

    const payload = {
      name: req.body.name,
      company_name: req.body.company_name ?? null,
      type: req.body.type ?? null,
      // price: req.body.price ?? null,
      // image_url: "",
    };

    const dataRows = await createService(dbTable, payload);

    // Upload Img
    if (req.files) {
      const filePath = imgUpload(
        req.files.image_url,
        folderNames.insurance,
        dataRows[0]
      );
      const updatedPayload = {
        image_url: `${process.env.BASE_URL}/image/${
          folderNames.insurance
        }/${path.basename(filePath)}`,
      };

      const fields = [];
      const values = [];
      for (const [key, value] of Object.entries(updatedPayload)) {
        fields.push(`${key} = $${fields.length + 1}`);
        values.push(value);
      }
      values.push(dataRows[0].id);

      const updatedInsuranceData = await updateService(dbTable, fields, values);

      return res.status(201).json({
        data: updatedInsuranceData[0],
      });
    }


    await createService("vehicle_insurance", {
      insurance_id: dataRows[0].id,
      purchase_date: req.body.purchase_date,
      expired_date: req.body.expired_date,
      vehicle_id: req.body.vehicle_id,
    });

    return res.status(201).json({
      data: dataRows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
