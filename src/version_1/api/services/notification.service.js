import { getMessaging } from 'firebase-admin/messaging';

export const sendNotification = async (token, message) => {
    try {
      // Ensure data values are strings
      const formattedData = {};
      if (message.data) {
        for (const [key, value] of Object.entries(message.data)) {
          formattedData[key] = String(value); // Convert all values to strings
        }
      }
  
      // Send notification
      const response = await getMessaging().send({
        token, // Device FCM token
        notification: {
          title: message.title, // Title of the notification
          body: message.body,  // Body of the notification
        },
        data: formattedData, // Ensure all data values are strings
      });
  
      console.log('Notification sent successfully:', response);
      return response;
    } catch (error) {
      console.error(`Error sending notification: ${error.message}`);
      throw error;
    }
  };