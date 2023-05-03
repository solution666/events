const fs = require('fs');
const nodemailer = require('nodemailer');
const EventEmitter = require('events');

class TemperatureEmitter extends EventEmitter {}

const temperatureEmitter = new TemperatureEmitter();

// Event 1: Save temperature data to file
temperatureEmitter.on('save', (date, temperature) => {
  const data = { date, temperature };
  const jsonData = JSON.stringify(data);

  fs.writeFile('temperature.json', jsonData, (err) => {
    if (err) throw err;
    console.log('Temperature data saved to file');
    temperatureEmitter.emit('calculateAverage', date);
  });
});

// Event 2: Calculate average temperature and send result to email
temperatureEmitter.on('calculateAverage', (date) => {
  fs.readFile('temperature.json', 'utf8', (err, data) => {
    if (err) throw err;

    const temperatures = data
      .split('\n')
      .filter(Boolean)
      .map(JSON.parse)
      .filter(({ date: d }) => d === date)
      .map(({ temperature }) => temperature);

    const averageTemperature = temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length;

    console.log(`Average temperature on ${date}: ${averageTemperature}°C`);

    temperatureEmitter.emit('sendEmail', date, averageTemperature);
  });
});

// Event 3: Send email if temperature is higher than 30°C
temperatureEmitter.on('sendEmail', (date, temperature) => {
  if (temperature > 30) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-password'
      }
    });

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: 'recipient-email@gmail.com',
      subject: `Temperature Alert: ${date}`,
      text: `The temperature on ${date} was ${temperature}°C.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) throw err;
      console.log('Temperature alert email sent');
    });
  }
});

// Trigger the 'save' event with a sample data
temperatureEmitter.emit('save', '2023-05-03', 25);
