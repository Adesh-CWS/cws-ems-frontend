import React from 'react'
import AllEmployeeRegularizationRequestForAdmin from '../Regularizations/AllEmployeeRegularizationRequestForAdmin'
import AdminAddLeaveBalance from '../Leaves/AdminAddLeaveBalance'

function AllRequest() {
  return (
    <div>
      <AllEmployeeRegularizationRequestForAdmin showBackButton={false} />
     <AdminAddLeaveBalance/>
    </div>
  )
}

export default AllRequest
