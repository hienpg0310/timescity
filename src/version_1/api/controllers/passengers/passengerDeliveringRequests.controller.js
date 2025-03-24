/** @format */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { isUUID, validatePagination } from "../../../utils/common.js";
import {
  createService,
  getAllService,
  getByIdService,
  updateService,
} from "../../services/index.js";
import nodemailer from "nodemailer";
import {
  getAllPassengerDeliveringRequestsService
} from "../../services/passengerDeliveringRequests.service.js";
import { imgUpload } from "../../../utils/fileHandle.js";
import { folderNames } from "../../../utils/constants.js";
import path from "path";
const dbTable = "passengers";

export const getPassengerDeliveringRequestsController = async (req, res) => {
  try {
    const { pageNum, pageSizeNum, order, isdelete, skip } =
      validatePagination(req);

    const dataRows = await getAllPassengerDeliveringRequestsService(
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

export const updatePassengerDeliveringRequestController = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader.split(" ")[1];
    const { passengerid = "", status = "" } = req.query;
    const { id } = req.params
    const decoded = jwt.verify(
      accessToken,
      process.env.ACCESS_TOKEN_PRIVATE_KEY
    );
    const employee = await getByIdService("employees", decoded.id);

    if (employee.length === 0)
      return res.status(404).json({ message: "Employee not found" });

    if (status === "") {
      return res.status(400).json({ message: "Invalid parameter" });
    }

    const fields = [];
    const values = [];

    const payload = {
      status: status,
      employeeid: decoded.id
    }

    for (const [key, value] of Object.entries(payload)) {
      fields.push(`${key} = $${fields.length + 1}`);
      values.push(value);
    }
    values.push(id);
    const dataRows = await updateService("passenger_delivering_requests", fields, values);
    const passengerRows = await getByIdService("passengers", dataRows[0].passengerid)

    if (status == "Approved") {
      const newReq = await createService("delivering_requests", {
        name: dataRows[0].name, delivering_date: dataRows[0].delivering_date, guest_number: dataRows[0].guest_number
      })
      var newRoutes = []
      var bodyFieldError = false
      const newRouteArr = JSON.parse(dataRows[0].routes)
      for (let i = 0; i < newRouteArr.length; i++) {
        const element = req.body.routes[i];
        if (!element.departure_time || !element.arrival_time ||
          !element.departure_location || !element.destination_location ||
          !element.driverid ||
          !element.departure_lat || !element.departure_long ||
          !element.destination_lat || !element.destination_long) {
          bodyFieldError = true
          break;
        }

        if (new Date(`${element.arrival_time} UTC`) < new Date(`${element.departure_time} UTC`)) {
          bodyFieldError = true
          break;
        }

        var passengerArr = []
        passengerArr.push(dataRows[0].passengerid)

        const newRoute = await createService("delivering_routes", {
          departure_time: element.departure_time,
          arrival_time: element.arrival_time,
          departure_location: element.departure_location,
          destination_location: element.destination_location,
          passengers: passengerArr,
          driverid: element.driverid,
          note: element.note ?? "",
          requestid: newReq[0].id,
          departure_lat: element.departure_lat,
          departure_long: element.departure_long,
          destination_lat: element.destination_lat,
          destination_long: element.destination_long,
          vehicleid: element.vehicleid ?? ""
        })

        newRoutes.push(newRoute[0])
      }

      if (bodyFieldError) {
        return res.status(400).json({ message: 'Request fields invalid' })
      }

      // //#region Email
      // const transporter = nodemailer.createTransport({
      //   service: "gmail", // Sử dụng Gmail (hoặc thay bằng SMTP server khác)
      //   auth: {
      //     // user: "taynv@1cinnovation.com", // Email của bạn
      //     // pass: "cjhg vzex cuwj nkxl", // Mật khẩu ứng dụng của email
      //     user: "nguyenvantay061999@gmail.com", // Email của bạn
      //     pass: "lcvr rewz rqxq vpxp", // Mật khẩu ứng dụng của email
      //   },
      // });
      // // Nội dung email
      // const mailOptions = {
      //   from: "nguyenvantay061999@gmail.com", // Email gửi
      //   to: passengerRows[0].email, // Email khách hàng
      //   subject: "[Techfis] - Tài khoản của bạn đã được phê duyệt",
      //   html: `
      //       <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      //         <p>Kính gửi <strong>${passengerRows[0].last_name} ${passengerRows[0].first_name}</strong>,</p>
      //         <p>Chúng tôi rất vui mừng thông báo rằng tài khoản của bạn tại [Techfis] đã được phê duyệt thành công.</p>                                              
      //         <p>Hãy đăng nhập vào ứng dụng và đổi mật khẩu ngay để đảm bảo an toàn tài khoản của bạn.</p>
      //         <p>
      //           Nếu có bất kỳ câu hỏi hoặc cần thêm thông tin, Quý khách vui lòng liên hệ hotline: 
      //           <a href="tel:+84 24 3926 4083" style="color: #007bff; text-decoration: none;">+84 24 3926 4083</a>.
      //         </p>
      //         <p>
      //           Techfis chân thành cảm ơn & rất mong được đồng hành cùng Quý khách!
      //         </p>
      //         <p>Trân trọng,</p>
      //         <p><strong>Techfis.</strong></p>
      //       </div>
      //     `,
      // };

      // // Gửi email
      // transporter.sendMail(mailOptions, (error, info) => {
      //   if (error) {
      //     console.error("Error sending email:", error);
      //   } else {
      //     console.log("Email sent:", info.response);
      //   }
      // });
      // //#endregion


      return res.status(201).json({
        data: {
          ...dataRows[0],
          routes: newRoutes
        }
      })
    }

    return res.status(200).json({
      data: dataRows,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};
