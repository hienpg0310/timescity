import bcrypt from "bcrypt";
import { getDefaultRoleService } from "../../services/roles.service.js";
import { isUUID } from "../../../utils/common.js";
import {
  createService,
  getAllService,
  getByIdService,
  updateService,
} from "../../services/index.js";
import { getAvailableVehiclesService, getInsuranceVehicle } from "../../services/vehicles.service.js";
import { imgUpload } from "../../../utils/fileHandle.js";
import { folderNames } from "../../../utils/constants.js";
import path from "path";
const dbTable = "vehicles";

export const getVehiclesController = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      order = "desc",
      isdelete = "false",
      departureTime = "",
      arrivalTime = ""
    } = req.query;
    if (
      isNaN(Number(page)) ||
      isNaN(Number(pageSize)) ||
      Number(pageSize) < 1 ||
      (order != "asc" && order != "desc")
    ) {
      return res.status(400).json({ message: "Invalid parameter" });
    }

    const pageNum = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    const skip = (pageNum - 1) * pageSizeNum;

    let dataRows = []

    if (departureTime == "" || arrivalTime == "") {
      dataRows = await getAllService(
        dbTable,
        pageNum,
        pageSizeNum,
        skip,
        order,
        isdelete
      );
    } else {
      dataRows = await getAvailableVehiclesService(
        departureTime,
        arrivalTime,
        pageSizeNum,
        skip,
        isdelete
      );
    }
    const total = dataRows.length > 0 ? dataRows[0].total : 0;

    return res.status(200).json({
      data: dataRows,
      total: total,
      currentPage: pageNum == 0 ? 1 : pageNum,
      totalPages: pageNum == 0 ? 1 : Math.ceil(total / pageSizeNum),
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getVehicleDetailController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });

    const dataRows = await getByIdService(dbTable, id);
    if (dataRows.length === 0)
      return res.status(404).json({ message: "Data not found" });

    const insuranceRows = await getInsuranceVehicle(id);

    return res.status(200).json({
      data: {
        ...dataRows[0],
        insurances: insuranceRows,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const createVehicleController = async (req, res) => {
  try {
    if (
      !req.body.vehicle_number ||
      !req.body.vehicle_model
    )
      return res.status(400).json({ message: "Missing Required Fields" });

    const payload = {
      number: req.body.vehicle_number,
      model: req.body.vehicle_model ?? "",
      type: req.body.type ?? null,
      fuel: req.body.fuel ?? null,
      capacity: req.body.seat_capacity ?? null,
      img_path: null,
    };

    const dataRows = await createService(dbTable, payload);

    //Upload Img
    if (req.files) {
      const filePath = imgUpload(
        req.files.img_path,
        folderNames.vehicle,
        dataRows[0]
      );

      const updatedPayload = {
        img_path: `${process.env.BASE_URL}/image/${folderNames.vehicle
          }/${path.basename(filePath)}`,
      };

      const fields = [];
      const values = [];
      for (const [key, value] of Object.entries(updatedPayload)) {
        fields.push(`${key} = $${fields.length + 1}`);
        values.push(value);
      }
      values.push(dataRows[0].id);

      const updatedVehicleData = await updateService(dbTable, fields, values);
      // console.log("Updated vehicle data:", updatedVehicleData);

      return res.status(201).json({
        data: updatedVehicleData[0],
      });
    }

    return res.status(201).json({
      data: dataRows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateVehicleController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });

    const dataRows = await getByIdService(dbTable, id);
    if (dataRows.length === 0)
      return res.status(404).json({ message: "Data not found" });

    const fields = [];
    const values = [];    
    let imagePath = null
    if (req.files) {
      const filePath = imgUpload(
        req.files.img_path,
        folderNames.vehicle,
        dataRows[0]
      );

      imagePath = `${process.env.BASE_URL}/image/${folderNames.vehicle
      }/${path.basename(filePath)}`
    }

    const payload = {
      ...(req.body.vehicle_number && { number: req.body.vehicle_number }),
      ...(req.body.vehicle_model && { model: req.body.vehicle_model }),
      ...(req.body.type && { type: req.body.type }),
      ...(req.body.fuel && { fuel: req.body.fuel }),
      ...(req.body.seat_capacity && { capacity: req.body.seat_capacity }),
      ...(req.body.isdelete && { isdelete: req.body.isdelete }),
      ...(imagePath && { img_path: imagePath }),
    };

    for (const [key, value] of Object.entries(payload)) {
      fields.push(`${key} = $${fields.length + 1}`);
      values.push(value);
    }
    values.push(id);

    const updatedData = await updateService(dbTable, fields, values);

    return res.status(200).json({
      data: updatedData[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deleteVehicleController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });

    const dataRows = await getByIdService(dbTable, id);
    if (dataRows.length === 0)
      return res.status(404).json({ message: "Data not found" });

    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries({ isdelete: true })) {
      fields.push(`${key} = $${fields.length + 1}`);
      values.push(value);
    }
    values.push(id);

    const updatedData = await updateService(dbTable, fields, values);

    return res.status(200).json({
      data: updatedData[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
