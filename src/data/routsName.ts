export const routsNameMain = {
  home: `/`,
  admin: `/admin`,
  login: `/login`,

  registration: {
    student: `/student` // Estudante
  },

  admission: {
    enrollment: {
      index: `/enrollment`,
      create: `/enrollment/create`,
      setting: `/enrollment/setting/:enrollmentId`,
      settingStr: `/enrollment/setting`
    }
  },

  monthly_fee: {
    index: `/monthly_fee`, // Gerenciamento de mensalidades
    pay: `/monthly_fee/pay`
  },

  // ============================================

  dashboard: `/`,

  users: {
    index: '/users',
    view: '/users/:userId',
    edit: '/users/edit/:userId',
    create: '/users/create'
  },

  admins: {
    index: '/admins',
    view: '/admins/:adminId',
    viewStr: '/admins/view/',
    create: '/admins/create',
    edit: '/admins/edit/:adminId'
  },

  patients: {
    index: '/patients',
    view: '/patients/view/:patientId',
    viewStr: '/patients/view/',
    medicalInfo: '/patients/:patientId/medical-info'
  },

  technicians: {
    index: '/technicians',
    view: '/technicians/view/:technicianId',
    viewStr: '/technicians/view/',
    create: '/technicians/create',
    edit: '/technicians/edit/:technicianId'
  },

  partners: {
    index: '/partners',
    manage: '/partners/manage/:partnerId',
    manageStr: '/partners/manage/',
    create: '/partners/create',
    edit: '/partners/edit/:partnerId',
    editStr: '/partners/edit/'
  },

  services: {
    index: '/services',
    create: '/services/create',
    edit: '/services/edit/:serviceId',
    categories: '/services/categories',
    prices: '/services/prices'
  },

  serviceRequests: {
    index: '/service-requests',
    view: '/service-requests/:requestId',
    assignments: '/service-requests/assignments'
  },

  appointments: {
    index: '/appointments',
    create: '/appointments/create',
    edit: '/appointments/edit/:appointmentId',
    editStr: '/appointments/edit/',
    view: '/appointments/view/:appointmentId',
    viewStr: '/appointments/view/'
  },

  prescriptions: {
    index: '/prescriptions',
    create: '/prescriptions/create/:appointmentId',
    createStr: '/prescriptions/create/',
    view: '/prescriptions/view/:prescriptionId',
    viewStr: '/prescriptions/view/',
    edit: '/prescriptions/edit/:prescriptionId',
    editStr: '/prescriptions/edit/'
  },

  medications: {
    index: '/medications',
    create: '/medications/create',
    edit: '/medications/edit/:medicationId'
  },

  reminders: {
    index: '/reminders',
    create: '/reminders/create',
    edit: '/reminders/edit/:reminderId'
  },

  educationalContent: {
    index: '/educational-content',
    create: '/educational-content/create',
    edit: '/educational-content/edit/:contentId'
  },

  finance: {
    index: '/finance', // Dashboard Financeiro

    payments: {
      index: '/finance/payments',
      create: '/finance/payments/create',
      edit: '/finance/payments/edit/:paymentId',
      editStr: '/finance/payments/edit/',
      view: '/finance/payments/view/:paymentId',
      viewStr: '/finance/payments/view/'
    },

    payouts: {
      index: '/finance/payouts',
      details: '/finance/payouts/:payoutId',
      detailsStr: '/finance/payouts'
    },

    subscriptions: {
      index: '/finance/subscriptions',
      details: '/finance/subscriptions/:subscriptionId',
      detailsStr: '/finance/subscriptions'
    },

    reports: {
      index: '/finance/reports'
    }
  },

  lab: {
    exams: {
      index: '/lab/exams',
      create: '/lab/exams/create',
      edit: '/lab/exams/edit/:examId',
      editStr: '/lab/exams/edit/',
      view: '/lab/exams/view/:examId',
      viewStr: '/lab/exams/view/'
    }
  },

  support: {
    request: {
      index: '/support/request',
      view: '/support/request/:requestId'
    }
  },

  logs: {
    index: '/logs'
  },

  settings: {
    general: '/settings/general',
    appearance: '/settings/appearance',
    api: '/settings/api-keys',
    emails: '/settings/email-templates'
  },

  chat: {
    index: '/chat'
  }
}
