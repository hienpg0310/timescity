/** @format */

import bcrypt from "bcrypt";
import { getDefaultRoleService } from "../../services/roles.service.js";
import { isUUID, validatePagination } from "../../../utils/common.js";
import {
  createService,
  getAllService,
  getByIdService,
  updateService,
} from "../../services/index.js";
import {
  getEmployeeRolesService,
  updateEmployeeRolesService,
} from "../../services/employees.service.js";
import {
  getPassengerRoutesService,
  getAllPassengerService,
  getPassengerNoteService,
  createpassengerNoteService,
  getPassengerByPhoneService,
} from "../../services/passengers.service.js";
import { imgUpload } from "../../../utils/fileHandle.js";
import { folderNames } from "../../../utils/constants.js";
import path from "path";
const dbTable = "passengers";

export const getPassengersController = async (req, res) => {
  try {
    const { pageNum, pageSizeNum, order, isdelete, skip } =
      validatePagination(req);

    const dataRows = await getAllPassengerService(
      pageNum,
      pageSizeNum,
      skip,
      order,
      isdelete
    );
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

export const getPassengerDetailController = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });
    const { pageNum, pageSizeNum, order, isdelete, skip } =
      validatePagination(req);

    const dataRows = await getByIdService(dbTable, id);
    if (dataRows.length === 0)
      return res.status(404).json({ message: "Data not found" });

    const dataRoutes = await getPassengerRoutesService(id, pageSizeNum, skip);

    const notes = await getPassengerNoteService(id);

    return res.status(200).json({
      data: {
        ...dataRows[0],
        history_requests: dataRoutes,
        history_requests_totalPages: pageNum == 0
          ? 1
          : dataRoutes.length > 0
            ? Math.ceil(dataRoutes[0].total / pageSizeNum)
            : 0,
        notes: notes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getPassengerDetailByPhoneController = async (req, res) => {
  try {
    const { phone } = req.params;
    const { pageNum, pageSizeNum, order, isdelete, skip } =
      validatePagination(req);

    const dataRows = await getPassengerByPhoneService(phone);
    if (dataRows.length === 0)
      return res.status(204).json({ message: "Data not found" });

    const dataRoutes = await getPassengerRoutesService(dataRows[0].id, pageSizeNum, skip);

    const notes = await getPassengerNoteService(dataRows[0].id);

    return res.status(200).json({
      data: {
        ...dataRows[0],
        history_requests: dataRoutes,
        notes: notes,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// export const createPassengerController = async (req, res) => {
//   try {
//     // Kiểm tra các trường bắt buộc
//     if (!req.body.first_name || !req.body.last_name) {
//       return res.status(400).json({ message: "Missing Required Fields" });
//     }

//     // Tạo payload khách hàng
//     const payload = {
//       first_name: req.body.first_name,
//       last_name: req.body.last_name,
//       dob: req.body.dob ?? null,
//       gender: req.body.gender ?? null,
//       phone: req.body.phone ?? null,
//       email: req.body.email ?? null,
//       picture_url: null,
//       company_name: req.body.company_name ?? null,
//     };

//     // Tạo khách hàng mới
//     const dataRows = await createService(dbTable, payload);
//     if (!dataRows || dataRows.length === 0) {
//       return res.status(500).json({ message: "Failed to create passenger" });
//     }

//     const newPassenger = dataRows[0];

//     // Upload hình ảnh nếu có
//     if (req.files) {
//       const filePath = imgUpload(
//         req.files.picture_url,
//         folderNames.passenger,
//         newPassenger
//       );

//       const updatedPayload = {
//         picture_url: `${process.env.BASE_URL}/image/${
//           folderNames.passenger
//         }/${path.basename(filePath)}`,
//       };

//       const fields = [];
//       const values = [];
//       for (const [key, value] of Object.entries(updatedPayload)) {
//         fields.push(`${key} = $${fields.length + 1}`);
//         values.push(value);
//       }
//       values.push(newPassenger.id);

//       const updatedPassenger = await updateService(dbTable, fields, values);

//       return res.status(201).json({
//         data: updatedPassenger[0],
//       });
//     }

//     if (req.body.notes) {
//       // Giải mã chuỗi JSON nếu có
//       const notesData = JSON.parse(req.body.notes);

//       if (Array.isArray(notesData) && notesData.length > 0) {
//         const notesToCreate = notesData.map((note) => ({
//           passenger_id: newPassenger.id,
//           note_type: note.note_type,
//           description: note.description,
//         }));

//         await Promise.all(
//           notesToCreate.map((note) => createService("passenger_note", note))
//         );
//       }
//     }

//     return res.status(201).json({
//       data: newPassenger,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// export const createPassengerController = async (req, res) => {
//   try {
//     // Kiểm tra các trường bắt buộc
//     if (!req.body.first_name || !req.body.last_name) {
//       return res.status(400).json({ message: "Missing Required Fields" });
//     }

//     // Tạo payload khách hàng
//     const payload = {
//       first_name: req.body.first_name,
//       last_name: req.body.last_name,
//       dob: req.body.dob ?? null,
//       gender: req.body.gender ?? null,
//       phone: req.body.phone ?? null,
//       email: req.body.email ?? null,
//       picture_url: null,
//       company_name: req.body.company_name ?? null,
//     };

//     // Tạo khách hàng mới
//     const dataRows = await createService(dbTable, payload);
//     if (!dataRows || dataRows.length === 0) {
//       return res.status(500).json({ message: "Failed to create passenger" });
//     }

//     const newPassenger = dataRows[0];

//     console.log(req.files);
//     // Upload hình ảnh nếu có
//     if (req.files) {
//       const filePath = imgUpload(
//         req.files.picture_url,
//         folderNames.passenger,
//         newPassenger
//       );

//       const updatedPayload = {
//         picture_url: `${process.env.BASE_URL}/image/${
//           folderNames.passenger
//         }/${path.basename(filePath)}`,
//       };

//       const fields = [];
//       const values = [];
//       for (const [key, value] of Object.entries(updatedPayload)) {
//         fields.push(`${key} = $${fields.length + 1}`);
//         values.push(value);
//       }
//       values.push(newPassenger.id);

//       const updatedPassenger = await updateService(dbTable, fields, values);

//       return res.status(201).json({
//         data: updatedPassenger[0],
//       });
//     }

//     // Tạo các ghi chú nếu có
//     if (Array.isArray(req.body.notes) && req.body.notes.length > 0) {
//       const notesData = req.body.notes.map((note) => ({
//         passenger_id: newPassenger.id,
//         note_type: note.note_type,
//         description: note.description,
//       }));

//       await Promise.all(
//         notesData.map((note) => createService("passenger_note", note))
//       );
//     }

//     return res.status(201).json({
//       data: newPassenger,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// export const createPassengerController = async (req, res) => {
//   try {
//     // Kiểm tra các trường bắt buộc
//     if (!req.body.first_name || !req.body.last_name) {
//       return res.status(400).json({ message: "Missing Required Fields" });
//     }

//     // Tạo payload khách hàng
//     const payload = {
//       first_name: req.body.first_name,
//       last_name: req.body.last_name,
//       dob: req.body.dob ?? null,
//       gender: req.body.gender ?? null,
//       phone: req.body.phone ?? null,
//       email: req.body.email ?? null,
//       picture_url: null,
//       company_name: req.body.company_name ?? null,
//     };

//     // Tạo khách hàng mới
//     const dataRows = await createService(dbTable, payload);
//     if (!dataRows || dataRows.length === 0) {
//       return res.status(500).json({ message: "Failed to create passenger" });
//     }

//     const newPassenger = dataRows[0];

//     // Upload hình ảnh nếu có
//     if (req.files) {
//       const filePath = imgUpload(
//         req.files.picture_url,
//         folderNames.passenger,
//         newPassenger
//       );

//       const updatedPayload = {
//         picture_url: `${process.env.BASE_URL}/image/${
//           folderNames.passenger
//         }/${path.basename(filePath)}`,
//       };

//       const fields = [];
//       const values = [];
//       for (const [key, value] of Object.entries(updatedPayload)) {
//         fields.push(`${key} = $${fields.length + 1}`);
//         values.push(value);
//       }
//       values.push(newPassenger.id);

//       const updatedPassenger = await updateService(dbTable, fields, values);

//       return res.status(201).json({
//         data: updatedPassenger[0],
//       });
//     }

//     // Giải mã chuỗi JSON nếu có (notes)
//     if (req.body.notes) {
//       const notesData = [];
//       for (let i = 0; req.body[`notes[${i}]`]; i++) {
//         notesData.push({
//           note_type: req.body[`notes[${i}]`].note_type,
//           description: req.body[`notes[${i}]`].description,
//         });
//       }

//       // Xử lý dữ liệu notes (thêm vào cơ sở dữ liệu, hoặc xử lý khác)
//       if (notesData.length > 0) {
//         await Promise.all(
//           notesData.map((note) =>
//             createService("passenger_note", {
//               passenger_id: newPassenger.id,
//               note_type: note.note_type,
//               description: note.description,
//             })
//           )
//         );
//       }
//     }

//     return res.status(201).json({
//       data: newPassenger,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// export const createPassengerController = async (req, res) => {
//   try {
//     // Kiểm tra các trường bắt buộc
//     if (!req.body.first_name || !req.body.last_name) {
//       return res.status(400).json({ message: "Missing Required Fields" });
//     }

//     // Tạo payload khách hàng
//     const payload = {
//       first_name: req.body.first_name,
//       last_name: req.body.last_name,
//       dob: req.body.dob ?? null,
//       gender: req.body.gender ?? null,
//       phone: req.body.phone ?? null,
//       email: req.body.email ?? null,
//       picture_url: null,
//       company_name: req.body.company_name ?? null,
//     };

//     // Tạo khách hàng mới
//     const dataRows = await createService(dbTable, payload);
//     if (!dataRows || dataRows.length === 0) {
//       return res.status(500).json({ message: "Failed to create passenger" });
//     }

//     const newPassenger = dataRows[0];

//     // Upload hình ảnh nếu có
//     if (req.files) {
//       const filePath = imgUpload(
//         req.files.picture_url,
//         folderNames.passenger,
//         newPassenger
//       );

//       const updatedPayload = {
//         picture_url: `${process.env.BASE_URL}/image/${
//           folderNames.passenger
//         }/${path.basename(filePath)}`,
//       };

//       const fields = [];
//       const values = [];
//       for (const [key, value] of Object.entries(updatedPayload)) {
//         fields.push(`${key} = $${fields.length + 1}`);
//         values.push(value);
//       }
//       values.push(newPassenger.id);

//       const updatedPassenger = await updateService(dbTable, fields, values);

//       return res.status(201).json({
//         data: updatedPassenger[0],
//       });
//     }

//     // Giải mã chuỗi JSON nếu có (notes)
//     if (req.body.notes) {
//       const notesData = [];
//       for (let i = 0; req.body[`notes[${i}]`]; i++) {
//         notesData.push({
//           note_type: req.body[`notes[${i}]`].note_type,
//           description: req.body[`notes[${i}]`].description,
//         });
//       }

//       // Xử lý dữ liệu notes (thêm vào cơ sở dữ liệu, hoặc xử lý khác)
//       if (notesData.length > 0) {
//         for (const note of notesData) {
//           const notePayload = {
//             passenger_id: newPassenger.id,
//             note_type: note.note_type,
//             description: note.description,
//           };

//           // Chèn dữ liệu vào bảng passenger_note
//           await createpassengerNoteService("passenger_note", notePayload);
//         }
//       }
//     }

//     return res.status(201).json({
//       data: newPassenger,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// };
// // API tạo ghi chú cho hành khách
// export const createPassengerNoteController = async (req, res) => {
//   try {
//     // Kiểm tra trường passenger_id và note_type, description
//     if (
//       !req.body.passenger_id ||
//       !req.body.note_type ||
//       !req.body.description
//     ) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // Lưu ghi chú vào bảng passenger_note
//     const notePayload = {
//       passenger_id: req.body.passenger_id,
//       note_type: req.body.note_type,
//       description: req.body.description,
//     };

//     const note = await createpassengerNoteService(
//       "passenger_note",
//       notePayload
//     );

//     return res.status(201).json({
//       message: "Note added successfully!",
//       data: note,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: error.message,
//     });
//   }
// };

export const createPassengerController = async (req, res) => {
  try {
    // Kiểm tra các trường bắt buộc
    if (!req.body.first_name || !req.body.last_name || !req.body.phone) {
      return res.status(400).json({ message: "Missing Required Fields" });
    }

    const passengerRows = await getPassengerByPhoneService(req.body.phone);
    if (passengerRows.length !== 0)
      return res.status(409).json({ message: "Phone existed" });

    // Tạo payload khách hàng
    const payload = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      dob: req.body.dob ?? null,
      gender: req.body.gender ?? null,
      phone: req.body.phone,
      email: req.body.email ?? null,
      picture_url: "https://cdn-icons-png.flaticon.com/128/552/552848.png",
      company_name: req.body.company_name ?? null,
    };

    // Tạo khách hàng mới
    const dataRows = await createService(dbTable, payload);
    if (!dataRows || dataRows.length === 0) {
      return res.status(500).json({ message: "Failed to create passenger" });
    }

    const roleRows = await getDefaultRoleService("Passenger");
    await createService("passengers_roles", {
      passengerid: dataRows[0].id,
      roleid: roleRows[0].id,
    });

    const newPassenger = dataRows[0];

    // Tạo các ghi chú nếu có
    if (req.body.notes) {
      const notesArray = JSON.parse(req.body.notes);

      const sanitizedNotes = notesArray.map((note) => {
        if (!note.note_type || !note.description) {
          console.error("Invalid note data");
        }
        return {
          passenger_id: newPassenger.id,
          note_type: note.note_type.trim(),
          description: note.description.trim(),
        };
      });

      // Save notes to database
      await Promise.all(
        sanitizedNotes.map((note) => createService("passenger_note", note))
      );
    }

    // Upload hình ảnh nếu có
    if (req.files) {
      const filePath = imgUpload(
        req.files.picture_url,
        folderNames.passenger,
        newPassenger
      );

      const updatedPayload = {
        picture_url: `${process.env.BASE_URL}/image/${folderNames.passenger
          }/${path.basename(filePath)}`,
      };

      const fields = [];
      const values = [];
      for (const [key, value] of Object.entries(updatedPayload)) {
        fields.push(`${key} = $${fields.length + 1}`);
        values.push(value);
      }
      values.push(newPassenger.id);

      const updatedPassenger = await updateService(dbTable, fields, values);

      return res.status(201).json({
        data: updatedPassenger[0],
      });
    }

    // if (Array.isArray(req.body.notes) && req.body.notes.length > 0) {
    //   const notesData = req.body.notes.map((note) => ({
    //     passenger_id: newPassenger.id,
    //     note_type: note.note_type,
    //     description: note.description,
    //   }));

    //   await Promise.all(
    //     notesData.map((note) => createService("passenger_note", note))
    //   );
    // }

    return res.status(201).json({
      data: newPassenger,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const updatePassengerController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });

    const dataRows = await getByIdService("passengers", id);
    if (dataRows.length === 0)
      return res.status(404).json({ message: "Passenger not found" });

    let newPictureURL = null
    if (req.files) {
      const filePath = imgUpload(
        req.files.picture_url,
        folderNames.passenger,
        dataRows[0]
      );

      newPictureURL = `${process.env.BASE_URL}/image/${folderNames.passenger
        }/${path.basename(filePath)}`
    }

    const fields = [];
    const values = [];
    const payload = {
      ...(req.body.first_name && { first_name: req.body.first_name }),
      ...(req.body.last_name && { last_name: req.body.last_name }),
      ...(req.body.dob && { dob: req.body.dob }),
      ...(req.body.gender && { gender: req.body.gender }),
      ...(req.body.phone && { phone: req.body.phone }),
      ...(req.body.email && { email: req.body.email }),
      ...(req.body.company_name && { company_name: req.body.company_name }),
      ...(newPictureURL && { picture_url: newPictureURL }),
    };

    for (const [key, value] of Object.entries(payload)) {
      fields.push(`${key} = $${fields.length + 1}`);
      values.push(value);
    }
    values.push(id);

    const updatedData = await updateService("passengers", fields, values);

    if (Array.isArray(req.body.notes) && req.body.notes.length > 0) {
      for (const note of req.body.notes) {
        await createService("passenger_note", {
          passenger_id: newPassenger.id,
          note_type: note.note_type,
          description: note.description,
        });
      }
    }
    return res.status(200).json({
      message: "Passenger updated successfully",
      data: updatedData[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const deletePassengerController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUUID(id)) return res.status(400).json({ message: "Invalid id" });

    const passengerData = await getByIdService("passengers", id);
    if (passengerData.length === 0)
      return res.status(404).json({ message: "Passenger not found" });

    const passengerFields = ["isdelete = $1"];
    const passengerValues = [true, id];

    const updatedPassenger = await updateService(
      "passengers",
      passengerFields,
      passengerValues
    );

    const noteFields = ["isdelete = $1"];
    const noteValues = [true, id];

    await updateService("passenger_note", noteFields, [...noteValues]);

    return res.status(200).json({
      message: "Passenger and related notes deleted successfully ",
      data: updatedPassenger[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
