import React, { useState, useEffect } from 'react'
import Dropzone from 'react-dropzone'
import Timeline from 'react-calendar-timeline'
import './App.css'
import 'react-calendar-timeline/lib/Timeline.css'
import Moment from 'moment';
import { extendMoment } from 'moment-range';

const moment = extendMoment(Moment);

const apiUrl = 'http://localhost:3001'

export const App = () => {
  const [existingBookingsList, setExistingBookingsList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newGroups, setNewGroups] = useState([]);
  const [newBookingsList, setNewBookingsList] = useState([]);

  useEffect(() => {
    fetchExistingBookings()
  }, [])

  const fetchExistingBookings = () => {
    fetch(`${apiUrl}/bookings`)
      .then((response) => response.json())
      .then((bookingsList) => {
        setExistingBookingsList(calendarBookingObject(bookingsList));
        setGroups(calendarGroupObject(bookingsList));
      })
  }

  const calendarGroupObject = (list) => {
    return list.map((booking, index) => ({
      id: index,
      title: `User ${booking.userId}`
    }));
  }

  const calendarBookingObject = (list) => {
    return list.map((booking, index) => ({
      userId: booking.userId,
      duration: booking.duration,
      id: index,
      group: index,
      title: `User ${booking.userId}`,
      start_time: moment(booking.time),
      end_time: moment(booking.time).add(booking.duration, 'm'),
    }));
  }

  const csvToObject = (csv) => {
    const [headerLine, ...lines] = csv.split('\n');
    const headers = headerLine.split(', ');
    const objects = lines.filter(Boolean).map((line, index) =>
      line.split(', ').reduce((object, value, index) => ({
        ...object,
        [headers[index]]: value,
      }), {})
    );
    return objects;
  }

  const doesTimeOverlap = (existingStart, existingEnd, newStart, newEnd) => {
    const existingRange = moment.range(existingStart, existingEnd);
    const newRange = moment.range(newStart, newEnd)
    return existingRange.overlaps(newRange);
  }

  const checkForOverlappingBookings = (bookings) => {
    let bookingsToCheck = existingBookingsList;
    let newBookings = [];

    bookings.forEach((booking) => {
      if (bookingsToCheck.find((existingBooking) => doesTimeOverlap(existingBooking.start_time, existingBooking.end_time, booking.start_time, booking.end_time))) {
        newBookings = [...newBookings, {
          ...booking,
          isOverlapping: true,
          itemProps: {
            style: {
              background: 'red',
            }
          }
        }]
      } else {
        newBookings = [...newBookings, booking];
      }
      bookingsToCheck = [...bookingsToCheck, booking];
    })
    return newBookings;
  }

  const onDrop = (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => console.log('CSV file was aborted')
      reader.onerror = () => console.log('CSV file has failed')
      reader.onload = () => {
        const data = csvToObject(reader.result);
        const list = calendarBookingObject(data);
        const newBookings = checkForOverlappingBookings(list);
        setNewBookingsList(newBookings);
        setNewGroups(calendarGroupObject(data));
      }
      reader.readAsText(file)
    })
  };

  const addNewBookings = () => {
    const bookingsToAdd = newBookingsList.filter(booking => !booking.isOverlapping).map(booking => ({
      time: booking.start_time,
      duration: booking.duration,
      user_id: booking.userId,
    }));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${apiUrl}/bookings`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(bookingsToAdd));
    // xhr.onreadystatechange = () => {
    //   if (xhr.status === 200) {
    //     console.log('yeeeaaaah')
    //   } else {
    //     console.log('Something went wrong, please try again')
    //   }
    // }
    xhr.addEventListener('load', fetchExistingBookings);
    xhr.addEventListener('error', () => console.log('Something went wrong, please try again'));
    setNewBookingsList([]);
    setNewGroups([]);
  }

  return (
    <div className='App'>
      <div className='App-header'>
        <Dropzone accept='.csv' onDrop={onDrop}>
          Drag files here
        </Dropzone>
      </div>
      <div className='App-main'>
        <p>Existing bookings:</p>
        {!!existingBookingsList.length &&
          <Timeline
            groups={groups}
            items={existingBookingsList}
            defaultTimeStart={existingBookingsList[0].start_time}
            defaultTimeEnd={existingBookingsList[0].end_time}
            sidebarWidth={90}
          />
        }
        {!!newBookingsList.length &&
          <React.Fragment>
            <p>New bookings:</p>
            <Timeline
              groups={newGroups}
              items={newBookingsList}
              defaultTimeStart={newBookingsList[0].start_time}
              defaultTimeEnd={newBookingsList[0].end_time}
              sidebarWidth={90}
            />
            <p>Overlapping bookings are as follows, they will not be added to the bookings list:</p>
            <ul>
              {newBookingsList.filter(item => item.isOverlapping).map((booking) => (
                <li>{`${booking.title}: ${moment(booking.start_time).format("DD/MM/YYYY hh:mm")} - ${moment(booking.end_time).format("DD/MM/YYYY hh:mm")}`}</li>
              ))}
            </ul>
            <button onClick={addNewBookings}>Add new bookings</button>
          </React.Fragment>
        }
      </div>
    </div>
  )
}
