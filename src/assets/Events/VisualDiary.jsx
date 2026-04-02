//Added by snehal
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./VisualDiary.css";

const CATEGORY_LIST = [
  "Rewards & Recognition",
  "Engagement Activities",
  "Social Activities",
];

const FILE_TYPES = ["image", "video", "pdf"];

const VisualDiary = () => {
  const [gallery, setGallery] = useState([]);
  const [activeType, setActiveType] = useState("image");
  const [loading, setLoading] = useState(true);
  const [popupItem, setPopupItem] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/gallery")
      .then((res) => {
        setGallery(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gallery API Error:", err);
        setLoading(false);
      });
  }, []);

  const getCategoryItems = (category) => {
    return gallery.filter((item) => {
      const type = item.resourceType || item.type;

      if (activeType === "pdf") {
        return item.category === category && (type === "raw" || type === "pdf");
      }

      return item.category === category && type === activeType;
    });
  };
  useEffect(() => {
    const isModalOpen = popupItem;

    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [popupItem]);
  return (
    <div className="gallery-wrapper">
      {/* FILTER */}
      <div className="top-filter-bar">
        {FILE_TYPES.map((type) => (
          <button
            key={type}
            // className={activeType === type ? "filter active" : "filter" }
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
            onClick={() => setActiveType(type)}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <p className="loading-text">Loading gallery...</p>}

      {/* THREE COLUMNS */}
      <div className="three-column-layout">
        {CATEGORY_LIST.map((category) => {
          const items = getCategoryItems(category);

          return (
            <div key={category} className="section-wrapper">
              <h3 className="category-title " style={{ fontWeight: "500" }}>
                {category}
              </h3>

              {/* SCROLLABLE SECTION */}
              <div className="section-card" style={{ marginTop: "15px" }}>
                {items.length === 0 && !loading && (
                  <p className="no-data">No data available</p>
                )}

                {items.map((item) => {
                  const type = item.resourceType || item.type;
                  const fileUrl = item.url;

                  return (
                    <div
                      key={item._id}
                      className="card shadow-sm border-0 event-holiday-card text-center gallery-card"
                      onClick={() => setPopupItem({ ...item, type, fileUrl })}
                    >
                      <div className="card-body">
                        {/* TOP TITLE */}
                        <h6 className="card-title fw-semibold">{item.title}</h6>

                        <hr className="card-divider" />

                        {/* ICON */}
                        <div className="mb-2">
                          <i
                            className={
                              type === "image"
                                ? "bi bi-image"
                                : type === "video"
                                  ? "bi bi-play-circle"
                                  : "bi bi-file-earmark-pdf"
                            }
                            style={{
                              fontSize: "26px",
                              color: "#3a5fbe",
                            }}
                          ></i>
                        </div>

                        {/* NAME */}
                        <div className="holiday-details">
                          {item.description}
                        </div>

                        {/* DATE */}
                        {item.createdAt && (
                          <div className="event-details">
                            {new Date(item.createdAt).toLocaleDateString(
                              "en-CA",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* POPUP */}
      {/* {popupItem && (
        <div
          className="popup-overlay"
          onClick={() => setPopupItem(null)}
        >
          <div
            className="popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="popup-close"
              onClick={() => setPopupItem(null)}
            >
              ×
            </span>

            <h3>{popupItem.title}</h3>
            <p>{popupItem.description}</p>

            {popupItem.type === "image" && (
              <img
                src={popupItem.fileUrl}
                alt={popupItem.title}
              />
            )}

            {popupItem.type === "video" && (
              <video
                src={popupItem.fileUrl}
                controls
                autoPlay
              />
            )}

            {(popupItem.type === "raw" ||
              popupItem.type === "pdf") && (
              <iframe
                src={popupItem.fileUrl}
                title={popupItem.title}
                frameBorder="0"
              ></iframe>
            )}
          </div>
        </div>
      )} */}
      {popupItem && (
        <div
          className="custom-modal-bg"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            position: "fixed",
            inset: 0,
            zIndex: 1050,
          }}
        >
           {" "}
          {/* onClick={() => setPopupItem(null)} */} 
          <div
            className="custom-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="custom-modal-content">
              {/* HEADER */}
              <div
                className="custom-modal-header"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <span className="custom-modal-title">{popupItem.title}</span>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setPopupItem(null)}
                ></button>
              </div>

              {/* BODY */}
              <div className="custom-modal-body text-center">
                {popupItem.type === "image" && (
                  <img
                    src={popupItem.fileUrl}
                    alt={popupItem.title}
                    className="popup-media"
                  />
                )}

                {popupItem.type === "video" && (
                  <video
                    src={popupItem.fileUrl}
                    controls
                    autoPlay
                    className="popup-media"
                  />
                )}

                {(popupItem.type === "raw" || popupItem.type === "pdf") && (
                  <iframe
                    src={popupItem.fileUrl}
                    title={popupItem.title}
                    className="popup-iframe"
                  />
                )}

                {popupItem.description && (
                  <p className="mt-2 event-details">{popupItem.description}</p>
                )}
                <div className="text-end mt-3">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={() => setPopupItem(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACK BUTTON */}
      <div className="text-end mt-3">
        <button
          className="btn btn-sm custom-outline-btn"
          style={{ minWidth: 90 }}
          onClick={() => {
            if (activeType === "pdf") {
              setActiveType("video");
            } else if (activeType === "video") {
              setActiveType("image");
            } else {
              window.history.go(-1);
            }
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default VisualDiary;
