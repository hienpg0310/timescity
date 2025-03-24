import bcrypt from "bcrypt";
import { v4 } from "uuid";
import jwt from "jsonwebtoken";
import {
    loginService,
    employeeLoginService,
    createTokensService,
    getIdByRefreshTokenService,
    updateExpiredTokensService,
    getDriverRolesAndPermissionsService,
    getEmployeeRolesAndPermissionsService,
    passengerLoginService,
    getPassengerRolesAndPermissionsService,
} from "../../services/auth.service.js";
import dotenv from "dotenv";
import { getDefaultRoleService } from "../../services/roles.service.js";
import { createService } from "../../services/index.js";
import nodemailer from "nodemailer";
import { getPassengerByPhoneService } from "../../services/passengers.service.js";
import { imgUpload } from "../../../utils/fileHandle.js"
dotenv.config();

const expirationTime = {
    minute: "m",
    day: "d",
};
const accessTokenExpiration = {
    time: 5,
    type: expirationTime.day,
};
const refreshTokenExpiration = {
    time: 7,
    type: expirationTime.day,
};

const generateAccessToken = (userid, ip, userAgent, roles, permissions) => {
    return jwt.sign(
        { id: userid, roles, permissions, ip, userAgent },
        process.env.ACCESS_TOKEN_PRIVATE_KEY,
        {
            expiresIn: `${accessTokenExpiration.time}${accessTokenExpiration.type}`,
        }
    );
};

const generateRefreshToken = (userid, type) => {
    return jwt.sign({ id: userid, type }, process.env.REFRESH_TOKEN_PRIVATE_KEY, {
        expiresIn: `${refreshTokenExpiration.time}${refreshTokenExpiration.type}`,
    });
};

export const loginController = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userRows = await loginService(username);
        if (userRows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "User not exist",
            });
        }

        const isPasswordValid = bcrypt.compare(password, userRows[0].password);
        if (!isPasswordValid) {
            return res.status(400).json({
                status: 400,
                message: "Invalid credentials",
            });
        }

        const { roles, permissions } = await getDriverRolesAndPermissionsService(
            userRows[0].driverid
        );

        const ip =
            req.header("x-forwarded-for") || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];
        const accessToken = generateAccessToken(
            userRows[0].driverid,
            ip,
            userAgent,
            roles,
            permissions
        );
        const refreshToken = generateRefreshToken(userRows[0].driverid, "driver");
        const csrfToken = v4()
        await createTokensService(accessToken, refreshToken, csrfToken, userRows[0].driverid)

        // res.cookie('accessToken', accessToken, {
        //     httpOnly: true, secure: true, sameSite: 'Strict',
        //     maxAge: accessTokenExpiration.type == expirationTime.minute
        //         ? (Number(accessTokenExpiration.time) * 60 * 1000)
        //         : accessTokenExpiration.type == expirationTime.day
        //             ? (Number(accessTokenExpiration.time) * 24 * 60 * 60 * 1000)
        //             : (15 * 60 * 1000)
        // });
        // res.cookie('refreshToken', refreshToken, {
        //     httpOnly: true, secure: true, sameSite: 'Strict',
        //     maxAge: refreshTokenExpiration.type == expirationTime.minute
        //         ? (Number(refreshTokenExpiration.time) * 60 * 1000)
        //         : refreshTokenExpiration.type == expirationTime.day
        //             ? (Number(refreshTokenExpiration.time) * 24 * 60 * 60 * 1000)
        //             : (7 * 24 * 60 * 60 * 1000)
        // });
        // res.cookie('csrfToken', csrfToken, {
        //     httpOnly: false, secure: true, sameSite: 'Strict',
        //     maxAge: refreshTokenExpiration.type == expirationTime.minute
        //         ? (Number(refreshTokenExpiration.time) * 60 * 1000)
        //         : refreshTokenExpiration.type == expirationTime.day
        //             ? (Number(refreshTokenExpiration.time) * 24 * 60 * 60 * 1000)
        //             : (7 * 24 * 60 * 60 * 1000)
        // });

        return res.json({
            status: 200,
            message: "Login successful",
            accessToken: accessToken,
            refreshToken: refreshToken,
            csrfToken: csrfToken,
            roles: roles,

        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const employeeLoginController = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userRows = await employeeLoginService(username);
        if (userRows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "User not exist",
            });
        }

        // const isPasswordValid = bcrypt.compare(password, userRows[0].password);
        // if (!isPasswordValid) {
        if (password !== userRows[0].password) {
            return res.status(400).json({
                status: 400,
                message: "Invalid credentials",
            });
        }

        const { roles, permissions } =
            await getEmployeeRolesAndPermissionsService(userRows[0].employeeid);

        const ip =
            req.header("x-forwarded-for") || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];
        const accessToken = generateAccessToken(
            userRows[0].employeeid,
            ip,
            userAgent,
            roles,
            permissions
        );
        const refreshToken = generateRefreshToken(userRows[0].employeeid, "employee");
        const csrfToken = v4()
        await createTokensService(accessToken, refreshToken, csrfToken, userRows[0].employeeid)

        return res.json({
            status: 200,
            message: "Login successful",
            accessToken: accessToken,
            refreshToken: refreshToken,
            csrfToken: csrfToken,
            roles: roles,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const passengerLoginController = async (req, res) => {
    try {
        const { username, password } = req.body;
        const userRows = await passengerLoginService(username);
        if (userRows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "User not exist",
            });
        }

        // const isPasswordValid = bcrypt.compare(password, userRows[0].password);
        // if (!isPasswordValid) {
        if (password !== userRows[0].password) {
            return res.status(400).json({
                status: 400,
                message: "Invalid credentials",
            });
        }

        const { roles, permissions } =
            await getPassengerRolesAndPermissionsService(userRows[0].passengerid);

        const ip =
            req.header("x-forwarded-for") || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];
        const accessToken = generateAccessToken(
            userRows[0].passengerid,
            ip,
            userAgent,
            roles,
            permissions
        );
        const refreshToken = generateRefreshToken(userRows[0].passengerid, "passenger");
        const csrfToken = v4()
        await createTokensService(accessToken, refreshToken, csrfToken, userRows[0].passengerid)

        return res.json({
            status: 200,
            message: "Login successful",
            accessToken: accessToken,
            refreshToken: refreshToken,
            csrfToken: csrfToken,
            roles: roles,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const passengerSignupController = async (req, res) => {
    try {
        // Kiểm tra các trường bắt buộc
        if (!req.body.first_name || !req.body.last_name || !req.body.email || !req.body.phone) {
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
            email: req.body.email,
            picture_url: "https://cdn-icons-png.flaticon.com/128/552/552848.png",
            company_name: req.body.company_name ?? null,
        };

        // Tạo khách hàng mới
        let dataRows = []
        const existedUserRows = await getPassengerByPhoneService(req.body.phone)
        if (!existedUserRows || existedUserRows.length === 0) {
            dataRows = await createService("passengers", payload);
            if (!dataRows || dataRows.length === 0) {
                return res.status(500).json({ message: "Failed to create passenger" });
            }
        } else {
            dataRows = existedUserRows[0]
        }

        const roleRows = await getDefaultRoleService("Passenger");
        await createService("passengers_roles", {
            passengerid: dataRows[0].id,
            roleid: roleRows[0].id,
        });

        const newPassword = Math.floor(100000 + Math.random() * 900000)
        await createService("passenger_credentials", {
            passengerid: dataRows[0].id,
            username: req.body.email,
            password: newPassword,
        });

        await createService("passenger_registrations", {
            passengerid: dataRows[0].id
        });

        //#region Email
        const transporter = nodemailer.createTransport({
            service: "gmail", // Sử dụng Gmail (hoặc thay bằng SMTP server khác)
            auth: {
                // user: "taynv@1cinnovation.com", // Email của bạn
                // pass: "cjhg vzex cuwj nkxl", // Mật khẩu ứng dụng của email
                user: "nguyenvantay061999@gmail.com", // Email của bạn
                pass: "lcvr rewz rqxq vpxp", // Mật khẩu ứng dụng của email
            },
        });
        // Nội dung email
        const mailOptions = {
            from: "nguyenvantay061999@gmail.com", // Email gửi
            to: req.body.email, // Email khách hàng
            subject: "[Techfis] - Thông tin đăng nhập tài khoản",
            html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p>Kính gửi <strong>${req.body.last_name} ${req.body.first_name}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Techfis. Dưới đây là thông tin đăng nhập của bạn:</p>
          <ul style="list-style-type: none; padding-left: 0;">
          <li><strong>Tên đăng nhập:</strong> ${req.body.email}</li>
          <li><strong>Mật khẩu:</strong> ${newPassword}</li>
        </ul>
          <p>
            Techfis sẽ tiến hành kiểm tra đăng ký của Quý khách. 
            Trong trường hợp tài khoản hợp lệ, trong vòng 7 ngày làm việc chúng tôi sẽ xác nhận bằng email.
          </p>                    
          <p>Đăng nhập vào ứng dụng và đổi mật khẩu ngay khi nhận được email xác thực để đảm bảo an toàn tài khoản của bạn.</p>
          <p>
            Nếu có bất kỳ câu hỏi hoặc cần thêm thông tin, Quý khách vui lòng liên hệ hotline: 
            <a href="tel:+84 24 3926 4083" style="color: #007bff; text-decoration: none;">+84 24 3926 4083</a>.
          </p>
          <p>
            Techfis chân thành cảm ơn & rất mong được đồng hành cùng Quý khách!
          </p>
          <p>Trân trọng,</p>
          <p><strong>Techfis.</strong></p>
        </div>
      `,
        };

        // Gửi email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res
                    .status(500)
                    .json({ error: "Failed to send email", details: error.message });
            }
            console.log("Email sent:", info.response);
            res.status(200).json({
                message: "Email sent successfully",
                info: info.response,
            });
        });
        //#endregion


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

export const refreshTokenController = async (req, res) => {
    try {
        const csrfToken = req.headers["x-csrf-token"];
        const authHeader = req.headers["authorization"];
        const refreshToken = authHeader.split(" ")[1];

        if (!authHeader) return res.status(401).send('No token provided');
        if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' })
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_PRIVATE_KEY);
        const idRows = await getIdByRefreshTokenService(refreshToken, decoded.id)
        if (!idRows.length > 0) return res.status(403).json({ message: 'Invalid token' })
        if (!csrfToken || csrfToken !== idRows[0].csrf_token) {
            return res.status(403).json({ message: "Invalid CSRF token" });
        }

        // Rotate refresh token
        await updateExpiredTokensService(idRows[0].id);
        const newRefreshToken = generateRefreshToken(decoded.id, decoded.type);
        const ip =
            req.header("x-forwarded-for") || req.connection.remoteAddress;
        const userAgent = req.headers["user-agent"];

        const { roles, permissions } =
            decoded.type == "employee"
                ? await getEmployeeRolesAndPermissionsService(decoded.id)
                : decoded.type == "passenger"
                    ? await getPassengerRolesAndPermissionsService(decoded.id)
                    : await getDriverRolesAndPermissionsService(decoded.id)
        const newAccessToken = generateAccessToken(decoded.id, ip, userAgent, roles, permissions);
        const newCsrfToken = v4()
        await createTokensService(newAccessToken, newRefreshToken, newCsrfToken, decoded.id)

        // res.cookie('accessToken', newAccessToken, {
        //     httpOnly: true, secure: true, sameSite: 'Strict',
        //     maxAge: accessTokenExpiration.type == expirationTime.minute
        //         ? (Number(accessTokenExpiration.time) * 60 * 1000)
        //         : accessTokenExpiration.type == expirationTime.day
        //             ? (Number(accessTokenExpiration.time) * 24 * 60 * 60 * 1000)
        //             : (15 * 60 * 1000)
        // });
        // res.cookie('refreshToken', newRefreshToken, {
        //     httpOnly: true, secure: true, sameSite: 'Strict',
        //     maxAge: refreshTokenExpiration.type == expirationTime.minute
        //         ? (Number(refreshTokenExpiration.time) * 60 * 1000)
        //         : refreshTokenExpiration.type == expirationTime.day
        //             ? (Number(refreshTokenExpiration.time) * 24 * 60 * 60 * 1000)
        //             : (7 * 24 * 60 * 60 * 1000)
        // });
        // res.cookie('csrfToken', newCsrfToken, {
        //     httpOnly: false, secure: true, sameSite: 'Strict',
        //     maxAge: refreshTokenExpiration.type == expirationTime.minute
        //         ? (Number(refreshTokenExpiration.time) * 60 * 1000)
        //         : refreshTokenExpiration.type == expirationTime.day
        //             ? (Number(refreshTokenExpiration.time) * 24 * 60 * 60 * 1000)
        //             : (7 * 24 * 60 * 60 * 1000)
        // });

        return res.json({
            status: 200,
            message: "Token refreshed",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            csrfToken: newCsrfToken,
        });
    } catch (error) {
        if (error.message == "jwt expired") {
            return res.status(403).json({ message: error.message, error: error.message });
        } else {
            return res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
};
