import bcrypt from "bcrypt";
import { getDefaultRoleService } from "../../services/roles.service.js";
import { isUUID } from "../../../utils/common.js";
import {
  createService,
  getAllService,
  getByIdService,
  updateService,
} from "../../services/index.js";
import {
  getAvailableDriversService,
  getDriverCredentialsService,
  getDriverRolesService,
  updateDriverRolesService,
} from "../../services/drivers.service.js";
import { folderNames } from "../../../utils/constants.js";
import { imgUpload } from "../../../utils/fileHandle.js";
const dbTable = "drivers";
import path from "path";

export const getDriversController = async (req, res) => {
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
      dataRows = await getAvailableDriversService(
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

export const getDriverDetailController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });

    const dataRows = await getByIdService(dbTable, id);
    if (dataRows.length === 0) return res.status(404).json({ message: "Data not found" });
    const credentialRows = await getDriverCredentialsService(id)
    if (credentialRows.length === 0) return res.status(404).json({ message: "Driver is denied access" });

    return res.status(200).json({
      data: {
        ...dataRows[0],
        ...credentialRows[0]
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const createDriverController = async (req, res) => {
  try {
    if (!req.body.first_name || !req.body.last_name)
      return res.status(400).json({ message: "Missing Required Fields" });

    const payload = {
      first_name: req.body.first_name,
      last_name: req.body.last_name ?? "",
      dob: req.body.dob ?? null,
      email: req.body.email ?? null,
      phone_number: req.body.phone_number ?? null,
      address: req.body.address ?? null,
      // username: req.body.username ?? null,
      // password: req.body.password ?? null,
      image_url: null,
    };

    const dataRows = await createService(dbTable, payload);

    //Upload Img
    if (req.files) {
      const filePath = imgUpload(
        req.files.image_url,
        folderNames.driver,
        dataRows[0]
      );
      const updatedPayload = {
        image_url: `${process.env.BASE_URL}/image/${folderNames.driver
          }/${path.basename(filePath)}`,
      };

      const fields = [];
      const values = [];
      for (const [key, value] of Object.entries(updatedPayload)) {
        fields.push(`${key} = $${fields.length + 1}`);
        values.push(value);
      }
      values.push(dataRows[0].id);

      await updateService(dbTable, fields, values);
    }

    await createService("driver_credentials", {
      driverid: dataRows[0].id,
      username: req.body.email,
      password: await bcrypt.hash(req.body.password ?? "123456", 10),
    });

    const roleRows = await getDefaultRoleService("Driver");
    await createService("drivers_roles", {
      driverid: dataRows[0].id,
      roleid: roleRows[0].id,
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

export const updateDriverController = async (req, res) => {
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
        req.files.image_url,
        folderNames.driver,
        dataRows[0]
      );

      imagePath = `${process.env.BASE_URL}/image/${folderNames.driver
        }/${path.basename(filePath)}`
    }

    const payload = {
      ...(req.body.first_name && { first_name: req.body.first_name }),
      ...(req.body.last_name && { last_name: req.body.last_name }),
      ...(req.body.dob && { dob: req.body.dob }),
      ...(req.body.email && { email: req.body.email }),
      ...(req.body.phone_number && { phone_number: req.body.phone_number }),
      ...(req.body.address && { address: req.body.address }),
      ...(req.body.isdelete && { isdelete: req.body.isdelete }),
      ...(imagePath && { image_url: imagePath }),
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

export const deleteDriverController = async (req, res) => {
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

export const getDriverRolesController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });

    const dataRows = await getByIdService(dbTable, id);
    if (dataRows.length === 0)
      return res.status(404).json({ message: "Data not found" });

    const roles = await getDriverRolesService(id);

    return res.status(200).json({
      roles: roles,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updateDriverRolesController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });
    if (!req.body.roles)
      return res.status(400).json({ message: "Missing Required Fields" });
    if (req.body.roles) {
      if (!Array.isArray(req.body.roles))
        return res.status(400).json({ message: "Invalid Roles" });
    }

    const dataRows = await getByIdService(dbTable, id);
    if (dataRows.length === 0)
      return res.status(404).json({ message: "Data not found" });

    const currentDriverRoles = await getDriverRolesService(id);
    const newDriverRoles = new Set(req.body.roles);
    const updatedDriverRoles = [
      ...currentDriverRoles.map((item) => ({
        ...item,
        isdelete: !newDriverRoles.has(item.roleid),
      })),
      ...req.body.roles
        .filter(
          (roleid) => !currentDriverRoles.some((item) => item.roleid === roleid)
        )
        .map((roleid) => ({ roleid, isdelete: false })),
    ];

    updatedDriverRoles.forEach((element) => {
      const existDriverRoles = currentDriverRoles.find(
        (role) => role.roleid === element.roleid
      );

      if (existDriverRoles) {
        if (existDriverRoles.isdelete !== element.isdelete) {
          updateDriverRolesService(id, element.roleid, element.isdelete);
        }
      } else {
        createService("drivers_roles", {
          driverid: id,
          roleid: element.roleid,
        });
      }
    });

    return res.status(200).json({
      message: "Update success",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
