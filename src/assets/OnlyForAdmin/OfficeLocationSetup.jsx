// //working code
// import React, { useState, useEffect } from "react";
// import axios from "axios";

// function OfficeLocationSetup() {
//   const [location, setLocation] = useState({
//     name: "Pune Office",
//     lat: "",
//     lng: "",
//     address: "",
//   });
//   const [showModal, setShowModal] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // Fetch existing office location from backend
//   useEffect(() => {
//     axios
//       .get("http://localhost:8000/admin/office-location")
//       .then((res) => {
//         if (res.data.length) setLocation(res.data[0]);
//       })
//       .catch(console.error);
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setLocation({ ...location, [name]: value });
//   };

//   // Reverse geocode function to get address from lat/lng

//   const handleSave = async () => {
//   setLoading(true);
//   try {
//     await axios.post("http://localhost:8000/admin/office-location", location);

//     // ✅ Use a built-in alert OR SweetAlert if available
//     alert("Office location saved successfully!");

//     // ✅ Close modal after success
//     setShowModal(false);
//   } catch (err) {
//     console.error(err);
//     alert("Failed to save location. Please try again.");
//   } finally {
//     setLoading(false);
//   }
// };

//   const getAddressFromCoords = async (lat, lng) => {
//     try {
//       const res = await fetch(
//         ` https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
//       );
//       const data = await res.json();
//       return data.display_name || "Unknown location";
//     } catch (err) {
//       console.error("Reverse geocode error", err);
//       return "Unknown location";
//     }
//   };

//   const useCurrentLocation = () => {
//     if (!navigator.geolocation) {
//       alert("Geolocation is not supported by your browser.");
//       return;
//     }

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords;
//         const address = await getAddressFromCoords(latitude, longitude); // fetch address

//         setLocation((prev) => ({
//           ...prev,
//           lat: latitude,
//           lng: longitude,
//           address, // set human-readable address
//         }));

//         alert("Current location set!");
//       },
//       (error) => {
//         console.error(error);
//         alert("Unable to retrieve your location.");
//       }
//     );
//   };

//   return (

//     <div style={{ padding: "20px" }}>
//       {/*  <h3>Office Location Setup</h3> */}

//       {/*  <div style={{ marginBottom: "10px" }}>
//         <label>Office Name:</label>
//         <input
//           name="name"
//           value={location.name}
//           onChange={handleChange}
//           placeholder="Office Name"
//         />
//       </div>

//       <div style={{ marginBottom: "10px" }}>
//         <label>Latitude:</label>
//         <input
//           name="lat"
//           value={location.lat}
//           onChange={handleChange}
//           placeholder="Latitude"
//         />
//       </div>

//       <div style={{ marginBottom: "10px" }}>
//         <label>Longitude:</label>
//         <input
//           name="lng"
//           value={location.lng}
//           onChange={handleChange}
//           placeholder="Longitude"
//         />
//       </div>

//       <div style={{ marginBottom: "10px" }}>
//         <label>Address:</label>
//         <input
//           name="address"
//           value={location.address}
//           onChange={handleChange}
//           placeholder="Address"
//         />
//       </div>  */}

//       {/* Office Location Card */}
//       <div className="card shadow-sm mb-4 border-0">
//         <div className="card-body">
//           <div className="d-flex justify-content-between align-items-center mb-3">
//             <h6
//               className=" mb-0"
//               style={{ color: "#3A5FBE", fontSize:"20px",cursor: "pointer" }}

//             >
//               Office Location:
//             </h6>
//             <button  className="btn text-white"
//             style={{ borderRadius: "6px", backgroundColor: "#3A5FBF" }} onClick={() => setShowModal(true)}>Edit</button>
//           </div>

// <style>{`
//         .modal-body .btn:focus {
//           outline: none;
//         }

//         .modal-body .btn:focus-visible {
//           outline: 3px solid #3A5FBE;
//           outline-offset: 2px;
//           box-shadow: 0 0 0 4px rgba(58, 95, 190, 0.25);
//           transform: scale(1.02);
//           transition: all 0.2s ease;
//         }

//         .modal-body button[type="submit"]:focus-visible {
//           outline: 3px solid #ffffff;
//           outline-offset: 2px;
//           box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.4);
//           filter: brightness(1.1);
//         }

//         .modal-body button[type="button"]:focus-visible {
//           outline: 3px solid #3A5FBE;
//           outline-offset: 2px;
//           box-shadow: 0 0 0 4px rgba(58, 95, 190, 0.25);
//           background-color: rgba(58, 95, 190, 0.05);
//         }

//         .modal-body input:focus-visible {
//           outline: 2px solid #3A5FBE;
//           outline-offset: 2px;
//           border-color: #3A5FBE;
//           box-shadow: 0 0 0 3px rgba(58, 95, 190, 0.15);
//         }
//       `}</style>

//           {showModal && (
//             <div
//               className="modal fade show"
//               style={{
//                 display: "block",
//                 backgroundColor: "rgba(0,0,0,0.5)",
//               }}
//             >
//               <div className="modal-dialog">
//                 <div className="modal-content border-0 shadow-lg">
//                   <div
//                     className="modal-header text-white"
//                     style={{
//                       backgroundColor:"#3A5FBE", // Bootstrap blue
//                       borderTopLeftRadius: "5px",
//                       borderTopRightRadius: "5px",
//                     }}
//                   >
//                     <h5 className="modal-title mb-0">Office Location Setup</h5>
//                     <button
//                       type="button"
//                       className="btn-close btn-close-white"
//                       onClick={() => setShowModal(false)}
//                     ></button>
//                   </div>

//                   <div className="modal-body">
//                     <div className="mb-3">
//                       <label className="form-label" style={{ color: "#3A5FBF" }}>Office Name:</label>
//                       <input
//                         name="name"
//                         value={location.name}
//                         onChange={handleChange}
//                         className="form-control"
//                       />
//                     </div>
//                     <div className="mb-3">
//                       <label className="form-label" style={{ color: "#3A5FBF" }} >Latitude:</label>
//                       <input
//                         name="lat"
//                         value={location.lat}
//                         onChange={handleChange}
//                         className="form-control"
//                       />
//                     </div>
//                     <div className="mb-3">
//                       <label className="form-label" style={{ color: "#3A5FBF" }}>Longitude:</label>
//                       <input
//                         name="lng"
//                         value={location.lng}
//                         onChange={handleChange}
//                         className="form-control"
//                       />
//                     </div>
//                     <div className="mb-3">
//                       <label className="form-label" style={{ color: "#3A5FBF" }}>Address:</label>
//                       <input
//                         name="address"
//                         value={location.address}
//                         onChange={handleChange}
//                         className="form-control"
//                       />
//                     </div>
//                   </div>

//                   <div className="modal-footer">
//                     <div>
//                       <button onClick={useCurrentLocation}
//                        className="btn"
//                       style={{color: "#fff",backgroundColor:"#3A5FBE"}}
//                       >Use Current Location</button>
//                     </div>
//                     <button
//                       type="button"
//                        className="btn"
//                       style={{color: "#fff",backgroundColor:"#3A5FBE"}}
//                       onClick={handleSave}
//                     >
//                       Save changes
//                     </button>
//                     <button
//                       type="button"
//                       // className="btn"
//                       // style={{color: "#fff",backgroundColor:"#3A5FBE"}}
//                            className="btn btn-outline"
//                       style={{borderColor:"#3A5FBE",color:"#3A5FBE"}}
//                       onClick={() => setShowModal(false)}
//                     >
//                       Close
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           <div className="row g-3">
//             <div className="col-md-6">
//               <label className="form-label text-secondary">Office Name:</label>
//               <input
//                 name="name"
//                 value={location.name}
//                 onChange={handleChange}
//                 className="form-control bg-light border-0"
//                 placeholder="Office Name"
//                 readOnly
//               />
//             </div>

//             <div className="col-md-6">
//               <label className="form-label text-secondary">Longitude:</label>
//               <input
//                 name="lng"
//                 value={location.lng}
//                 onChange={handleChange}
//                 className="form-control bg-light border-0"
//                 placeholder="Longitude"
//                 readOnly
//               />
//             </div>

//             <div className="col-md-6">
//               <label className="form-label text-secondary">Latitude:</label>
//               <input
//                 name="lat"
//                 value={location.lat}
//                 onChange={handleChange}
//                 className="form-control bg-light border-0"
//                 placeholder="Latitude"
//                 readOnly
//               />
//             </div>

//             <div className="col-md-6">
//               <label className="form-label text-secondary">Address:</label>
//               <input
//                 name="address"
//                 value={location.address}
//                 onChange={handleChange}
//                 className="form-control bg-light border-0"
//                 placeholder="Address"
//                 readOnly
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default OfficeLocationSetup;

import React, { useState, useEffect } from "react";
import axios from "axios";

function OfficeLocationSetup() {
  const [location, setLocation] = useState({
    name: "Pune Office",
    lat: "",
    lng: "",
    address: "",
  });

  const [editLocation, setEditLocation] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

    // rutuja code 
    useEffect(() => {
      if (showModal) {
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';  
      } else {
        document.body.style.overflow = 'unset';
        document.body.style.height = 'auto';  
      }
    
      return () => {
        document.body.style.overflow = 'unset';
        document.body.style.height = 'auto';    
      };
    }, [showModal])
    // 
  

  // ✅ Fetch existing office location
  useEffect(() => {
    axios
      .get("http://localhost:8000/admin/office-location")
      .then((res) => {
        if (res.data.length) setLocation(res.data[0]);
      })
      .catch(console.error);
  }, []);

  // ✅ Use Current Location
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(
        ` https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      return data.display_name || "Unknown location";
    } catch (err) {
      console.error("Reverse geocode error", err);
      return "Unknown location";
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await getAddressFromCoords(latitude, longitude);

        setEditLocation((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          address,
          name: prev.name || "", // keep existing name editable
        }));

        alert("Current location set!");
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location.");
      },
    );
  };

  // ✅ Open modal & copy current data
  const openModal = () => {
    setEditLocation({ ...location });
    setShowModal(true);
  };

  // ✅ Save changes (only after clicking Save)
  const handleSave = () => {
    setLoading(true);

    axios
      .post("http://localhost:8000/admin/office-location", editLocation)
      .then(() => {
        setLocation(editLocation); // ✅ Update page only now
        alert("Office location saved");
      })
      .catch(() => alert("Failed to save location"))
      .finally(() => {
        setLoading(false);
        setShowModal(false);
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0" style={{ color: "#3A5FBE", fontSize: "20px" }}>
              Set Office Location
            </h6>

            <button
              className="btn btn-sm custom-outline-btn"
              style={{ minWidth: 90 }}
              onClick={openModal}
            >
              Edit
            </button>
          </div>

          {/* ✅ Modal */}
          {showModal && (
            <div
              className="modal fade show"
              style={{
                display: "block",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
            >
              <div className="modal-dialog"
              style={{
                maxWidth: "650px",
                width: "95%",
                marginTop: "100px" ,
              }}>
                <div className="modal-content border-0 shadow-lg">
                  <div
                    className="modal-header"
                    style={{
                      backgroundColor: "#3A5FBE",
                      color: "white",
                    }}
                  >
                    <h5 className="modal-title mb-0">Office Location Setup</h5>
                    <button
                      className="btn-close btn-close-white"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </div>

                  <div className="modal-body">
                    {/* Name */}
                    <div className="mb-3">
                      <label
                        className="form-label"
                        style={{ color: "#007BFF" }}
                      >
                        Office Name:
                      </label>
                      <input
                        name="name"
                        value={editLocation.name || ""}
                        onChange={(e) =>
                          setEditLocation({
                            ...editLocation,
                            [e.target.name]: e.target.value,
                          })
                        }
                        className="form-control"
                      // style={{ backgroundColor: "#E9F5FF" }}
                      />
                    </div>

                    {/* Latitude */}
                    <div className="mb-3">
                      <label
                        className="form-label"
                        style={{ color: "#007BFF" }}
                      >
                        Latitude:
                      </label>
                      <input
                        name="lat"
                        value={editLocation.lat || ""}
                        onChange={(e) =>
                          setEditLocation({
                            ...editLocation,
                            [e.target.name]: e.target.value,
                          })
                        }
                        className="form-control"
                      />
                    </div>

                    {/* Longitude */}
                    <div className="mb-3">
                      <label
                        className="form-label"
                        style={{ color: "#007BFF" }}
                      >
                        Longitude:
                      </label>
                      <input
                        name="lng"
                        value={editLocation.lng || ""}
                        onChange={(e) =>
                          setEditLocation({
                            ...editLocation,
                            [e.target.name]: e.target.value,
                          })
                        }
                        className="form-control"
                      />
                    </div>

                    {/* Address */}
                    <div className="mb-3">
                      <label
                        className="form-label"
                        style={{ color: "#007BFF" }}
                      >
                        Address:
                      </label>
                      <input
                        name="address"
                        value={editLocation.address || ""}
                        onChange={(e) =>
                          setEditLocation({
                            ...editLocation,
                            [e.target.name]: e.target.value,
                          })
                        }
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-sm custom-outline-btn"
                      onClick={useCurrentLocation}
                    >
                      Use Current Location
                    </button>

                    <button
                      className="btn btn-sm custom-outline-btn"
                      onClick={handleSave}
                    >
                      {loading ? "Saving..." : "Save changes"}
                    </button>

                    <button
                      className="btn btn-sm custom-outline-btn"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Readonly Display Section */}
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label " style={{ color: "#3A5FBE" }}>
                Office Name:
              </label>
              <input
                value={location.name}
                className="form-control bg-light border-0"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label " style={{ color: "#3A5FBE" }}>
                Longitude:
              </label>
              <input
                value={location.lng}
                className="form-control bg-light border-0"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label " style={{ color: "#3A5FBE" }}>
                Latitude:
              </label>
              <input
                value={location.lat}
                className="form-control bg-light border-0"
                readOnly
              />
            </div>

            <div className="col-md-6">
              <label className="form-label" style={{ color: "#3A5FBE" }}>
                Address:
              </label>
              <input
                value={location.address}
                className="form-control bg-light border-0"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
      {/* //Added by Mahesh */}
      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => window.history.go(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default OfficeLocationSetup;
