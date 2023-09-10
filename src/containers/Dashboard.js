import { formatDate } from '../app/format.js'
import DashboardFormUI from '../views/DashboardFormUI.js'
import BigBilledIcon from '../assets/svg/big_billed.js'
import { ROUTES_PATH } from '../constants/routes.js'
import USERS_TEST from '../constants/usersTest.js'
import Logout from "./Logout.js"

export const filteredBills = (data, status) => {
  return (data && data.length) ?
    data.filter(bill => {
      let selectCondition

      // in jest environment
      if (typeof jest !== 'undefined') {
        selectCondition = (bill.status === status)
      }
      /* istanbul ignore next */
      else {
        // in prod environment
        const userEmail = JSON.parse(localStorage.getItem("user")).email
        selectCondition =
          (bill.status === status) &&
          ![...USERS_TEST, userEmail].includes(bill.email)
      }

      return selectCondition
    }) : []
}

export const card = (bill) => {
  const firstAndLastNames = bill.email.split('@')[0]
  const firstName = firstAndLastNames.includes('.') ?
    firstAndLastNames.split('.')[0] : ''
  const lastName = firstAndLastNames.includes('.') ?
  firstAndLastNames.split('.')[1] : firstAndLastNames

  return (`
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}' data-id='${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `)
}

export const cards = (bills) => {
  return bills && bills.length ? bills.map(bill => card(bill)).join("") : ""
}

export const getStatus = (index) => {
  switch (index) {
    case 1:
      return "pending"
    case 2:
      return "accepted"
    case 3:
      return "refused"
  }
}

export default class {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    $('#arrow-icon1').click((e) => this.handleShowTickets(e, bills, 1))
    $('#arrow-icon2').click((e) => this.handleShowTickets(e, bills, 2))
    $('#arrow-icon3').click((e) => this.handleShowTickets(e, bills, 3))
    new Logout({ localStorage, onNavigate })
  }

  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
      .bills()
      .list()
      .then(snapshot => {
        const bills = snapshot
        .map(doc => ({
          id: doc.id,
          ...doc,
          date: doc.date,
          status: doc.status
        }))
        return bills
      })
      .catch(error => {
        throw error;
      })
    }
  }

  handleShowTickets(e, bills, index) {
    const statusContainer = $(`#status-bills-container${index}`);
    if (statusContainer.length === 0) return;
  
    if (this.arrowIndex === undefined || this.index !== index) this.arrowIndex = 0;
    if (this.index === undefined || this.index !== index) this.index = index;
  
    if (this.arrowIndex !== this.index) {
      $(`#arrow-icon${this.index}`).css({ transform: 'rotate(0deg)' });
      statusContainer.html(cards(filteredBills(bills, getStatus(this.index))));
      this.arrowIndex = this.index;
    } else {
      $(`#arrow-icon${this.index}`).css({ transform: 'rotate(90deg)' });
      statusContainer.html("");
      this.arrowIndex = 0;
    }
  
    statusContainer.off("click", ".bill-card").on("click", ".bill-card", (e) => {
      const clickedBillId = $(e.currentTarget).attr("data-id");
      const clickedBill = bills.find((bill) => bill.id === clickedBillId);
      this.handleEditTicket(e, clickedBill, bills);
    });
  
    return bills;
  }

  handleEditTicket(e, bill, bills) {
    if (this.billIndex === undefined || this.id !== bill.id) this.billIndex = 0
    if (this.id === undefined || this.id !== bill.id) this.id = bill.id
    if (this.billIndex !== this.id) {
      bills.forEach(b => {
        $(`#open-bill${b.id}`).css({ background: '#0D5AE5' })
      })
      $(`#open-bill${bill.id}`).css({ background: '#2A2B35' })
      $('.dashboard-right-container div').html(DashboardFormUI(bill))
      $('.vertical-navbar').css({ height: '150vh' })
      this.billIndex = this.id
    } else {
      $(`#open-bill${bill.id}`).css({ background: '#0D5AE5' })

      $('.dashboard-right-container div').html(`
        <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `)
      $('.vertical-navbar').css({ height: '120vh' })
      this.billIndex = 0
    }
    $('#icon-eye-d').click(this.handleClickIconEye)
    $('#btn-accept-bill').click((e) => this.handleAcceptSubmit(e, bill))
    $('#btn-refuse-bill').click((e) => this.handleRefuseSubmit(e, bill))
  }

  handleClickIconEye = () => {
    const billUrl = $('#icon-eye-d').attr("data-bill-url")
    const imgWidth = Math.floor($('#modaleFileAdmin1').width() * 0.8)
    $('#modaleFileAdmin1').find(".modal-body").html(`<div style='text-align: center;'><img width=${imgWidth} src=${billUrl} alt="Bill"/></div>`)
    if (typeof $('#modaleFileAdmin1').modal === 'function') $('#modaleFileAdmin1').modal('show')
  }

  handleAcceptSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'accepted',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  handleRefuseSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'refused',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  // not need to cover this function by tests
  /* istanbul ignore next */
  updateBill = (bill) => {
    if (this.store) {
    return this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: bill.id})
      .then(bill => bill)
      .catch(console.log)
    }
  }
}

// handleAcceptSubmit = (e, bill) => {
  // {const validText = document.querySelector('#valid-text').textContent;
  // console.log(validText);
  // const match = validText.match(/\((\d+)\)/);
  // if (match) {
  //   const validCount = parseInt(match[1]);
  //   document.querySelector('.status-bills-header h3').textContent = validText.replace(/\(\d+\)/, `(${validCount + 1})`);
  // }}
  // OR
//   {let totalValidElement = $(`#total-valided`);
//   let totalValid = parseInt(totalValidElement.text());}
//   const newBill = {
//     ...bill,
//     status: 'accepted',
//     commentAdmin: $('#commentary2').val()
//   }

//   totalValid += 1
//   totalValidElement.text(totalValid);

//   this.updateBill(newBill)
//   this.onNavigate(ROUTES_PATH['Dashboard'])
//   // window.location.reload()
// }

// handleRefuseSubmit = (e, bill) => {
//   let totalRefusedElement = $(`#total-refused`);
//   let totalRefused = parseInt(totalRefusedElement.text());
//   const newBill = {
//     ...bill,
//     status: 'refused',
//     commentAdmin: $('#commentary2').val()
//   }

//   totalRefused += 1
//   totalRefusedElement.text(totalRefused);
  
//   this.updateBill(newBill)
//   this.onNavigate(ROUTES_PATH['Dashboard'])
//   // window.location.reload()
// }
