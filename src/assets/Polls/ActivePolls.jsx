import axios from "axios";
import React, { useState, useEffect, useRef } from "react";

const ActivePolls = ({ user }) => {

  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [savedPolls, setSavedPolls] = useState([]);
  const [popupPreviousPolls, setPopupPreviousPolls] = useState(null);
  const [previousPolls, setPreviousPolls] = useState([]);
  const [voteMessage, setVoteMessage] = useState("");

  // rutuja code 
  const [showVotedMembers, setShowVotedMembers] = useState(false);
  const [selectedPollVotes, setSelectedPollVotes] = useState([]);
  const [selectedPollQuestion, setSelectedPollQuestion] = useState("");
  const [selectedPollOptions, setSelectedPollOptions] = useState([]);
  const [selectedPollType, setSelectedPollType] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showEditPoll, setShowEditPoll] = useState(false);
  const [editingPoll, setEditingPoll] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOptions, setEditOptions] = useState([]);
  // rutuja code edn

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchActivePoll = async () => {
      try {
        const res = await axios.get("https://ems-cws-backend-9wgt.vercel.app/api/polls/active");
        if (res.data) {
          setSavedPolls([res.data]);
        }
      } catch (err) {
        console.error("Failed to load active polls");
      }
    };

    fetchActivePoll();

    const interval = setInterval(fetchActivePoll, 5000); // every 5 sec

    return () => clearInterval(interval);

  }, []);

  useEffect(() => {
    const isModalOpen = popupPreviousPolls || showCreatePoll
      || showVotedMembers || showEditPoll; //rutuja 

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
  }, [popupPreviousPolls, showCreatePoll, showVotedMembers, showEditPoll]);
  //rutuja 


  const isAnyModalOpen = popupPreviousPolls || showCreatePoll
    || showVotedMembers || showEditPoll; //rutuja a

  useEffect(() => {

    if (!isAnyModalOpen || !modalRef.current) return;

    const modal = modalRef.current;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements.length) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];


    modal.focus();


    const handleKeyDown = (e) => {

      if (e.key === "Escape") {
        e.preventDefault();
        setPopupPreviousPolls(false);
        setShowCreatePoll(false);
        setShowVotedMembers(false); //rutuja 
        setShowEditPoll(false);//rutuja
      }

      // TAB key → focus trap
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        }
        else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    modal.addEventListener("keydown", handleKeyDown);

    return () => {
      modal.removeEventListener("keydown", handleKeyDown);
    };

  }, [isAnyModalOpen]);

  useEffect(() => {
    const fetchPreviousPolls = async () => {
      try {
        const res = await axios.get("https://ems-cws-backend-9wgt.vercel.app/api/polls/previous");
        setPreviousPolls(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPreviousPolls();
  }, []);

  // ========== Admin Poll Functions ==========
  const addOption = () => setOptions([...options, ""]);
  const updateOption = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };
  const removeOption = (index) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };
  const countWords = (text) => {
    return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  };

  const createPoll = async () => {
    if (!pollQuestion.trim() || options.some((o) => !o.trim())) {
      alert("Please enter a question and fill all options");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        "https://ems-cws-backend-9wgt.vercel.app/api/polls/create",
        {
          question: pollQuestion,
          description: pollDescription,
          options: options.map(opt => ({ text: opt }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const activeRes = await axios.get(
        "https://ems-cws-backend-9wgt.vercel.app/api/polls/active"
      );

      setSavedPolls(activeRes.data ? [activeRes.data] : []);
      setPollQuestion("");
      setPollDescription("");
      setOptions(["", ""]);
      setShowCreatePoll(false);

    } catch (err) {
      console.error(err);
    }
  };

  // ========== Employee Poll Functions ==========

  // rutuja code start
  const editPoll = async () => {
    if (!editingPoll) return;

    if (!editQuestion.trim() || editOptions.some(o => !o.text?.trim())) {
      alert("Please enter a question and fill all options");
      return;
    }

    if (editOptions.length < 2) {
      alert("At least 2 options are required");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      const response = await axios.put(
        `https://ems-cws-backend-9wgt.vercel.app/api/polls/${editingPoll._id}`,
        {
          question: editQuestion,
          description: editDescription,
          options: editOptions.map(opt => ({ text: opt.text }))
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSavedPolls(prev =>
        prev.map(p => p._id === editingPoll._id ? response.data.poll : p)
      );

      setPreviousPolls(prev =>
        prev.map(p => p._id === editingPoll._id ? response.data.poll : p)
      );

      setShowEditPoll(false);
      setEditingPoll(null);
      setEditQuestion("");
      setEditDescription("");
      setEditOptions([]);

      alert("Poll updated successfully!");

    } catch (err) {
      console.error("Error editing poll:", err);
      alert(err.response?.data?.message || "Failed to update poll");
    }
  };

  const openEditPoll = (poll) => {
    setEditingPoll(poll);
    setEditQuestion(poll.question);
    setEditDescription(poll.description || "");
    setEditOptions(poll.options.map(opt => ({ text: opt.text || opt })));
    setShowEditPoll(true);
  };

  const addEditOption = () => {
    setEditOptions([...editOptions, { text: "" }]);
  };

  const updateEditOption = (index, value) => {
    const updated = [...editOptions];
    updated[index] = { text: value };
    setEditOptions(updated);
  };

  const removeEditOption = (index) => {
    if (editOptions.length > 2) {
      setEditOptions(editOptions.filter((_, i) => i !== index));
    }
  };

  const [voting, setVoting] = useState(false);
  const storedUser = (() => {
    try {
      const employee = localStorage.getItem("employee");
      const userData = localStorage.getItem("user");
      return employee ? JSON.parse(employee) : userData ? JSON.parse(userData) : null;
    } catch (err) {
      console.error("Error parsing localStorage user", err);
      return null;
    }
  })();

  const loggedInUserId = user?._id ?? storedUser?._id ?? null;

  console.log("Logged in userId →", loggedInUserId);

  // rutuja code start
  const deletePoll = async (pollId) => {
    if (!window.confirm("Are you sure you want to delete this poll?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(
        `https://ems-cws-backend-9wgt.vercel.app/api/polls/${pollId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSavedPolls(prev => prev.filter(p => p?._id?.toString() !== pollId?.toString()));

      setPreviousPolls(prev => prev.filter(p => p?._id?.toString() !== pollId?.toString()));

      alert("Poll deleted successfully!");

    } catch (err) {
      console.error("Error deleting poll:", err);
      alert(err.response?.data?.message || "Failed to delete poll");
    }
  };
  // rutuja code edn

  const fetchVotedMembers = async (pollId, pollQuestion, pollOptions, pollType) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(
        `https://ems-cws-backend-9wgt.vercel.app/api/polls/${pollId}/voted-members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const votesByOption = pollOptions.map((option, index) => {
        const optionVotes = res.data.filter(vote => vote.optionIndex === index);
        return {
          optionText: option.text || option,
          optionIndex: index,
          votes: optionVotes,
          totalVotes: optionVotes.length
        };
      });

      setSelectedPollVotes(votesByOption);
      setSelectedPollQuestion(pollQuestion);
      setSelectedPollOptions(pollOptions);
      setSelectedPollType(pollType);
      setShowVotedMembers(true);
    } catch (err) {
      console.error("Error fetching voted members:", err);
      alert("Failed to load voted members");
    }
  };

  const votePoll = async (pollId, optionIndex) => {
    if (voting) return;

    if (!loggedInUserId) {
      setVoteMessage("User not logged in");
      return;
    }

    setVoting(true);

    try {
      const token = localStorage.getItem("accessToken");


      const res = await axios.post(
        "https://ems-cws-backend-9wgt.vercel.app/api/polls/vote",
        { pollId, optionIndex, userId: loggedInUserId },
        { headers: { Authorization: `Bearer ${token}` } }

      );
      setVoteMessage("");

      setSavedPolls(prev =>
        prev.map(p =>
          p?._id?.toString() === res.data?._id?.toString()
            ? res.data
            : p
        )
      );

      // 2️⃣ Previous polls modal update करा
      setPreviousPolls(prev =>
        prev.map(p =>
          p?._id?.toString() === res.data?._id?.toString()
            ? res.data
            : p
        )
      );


    } catch (err) {
      if (err.response?.status === 400) {
        setVoteMessage(err.response.data.message || "You already voted");

        setTimeout(() => {
          setVoteMessage("");
        }, 3000);
      } else {
        setVoteMessage("Voting failed");
      }
    }
    finally {
      setVoting(false);
    }
  };

  return (
    <div
      className="card shadow-sm h-100 border-0"
      style={{ borderRadius: "10px" }}
    >
      <div
        className="card-header d-flex justify-content-between align-items-center"
        style={{ backgroundColor: "#fff", borderRadius: "12px 12px 0 0", gap: "0.5rem" }}
      >
        <h6 className="mb-0" style={{ color: "#3A5FBE" }}>
          Active Polls
        </h6>

        {/* Only show create button to admin */}
        <div className="d-flex gap-2">
          {user?.role === "admin" && (
            <button
              className="btn btn-sm custom-outline-btn"
              style={{ minWidth: 90 }}
              onClick={() => setShowCreatePoll(true)}
            >
              Create Poll
            </button>
          )}
          <button
            className="btn btn-sm custom-outline-btn"
            style={{ minWidth: 90 }}
            onClick={() => setPopupPreviousPolls(true)}
          >
            View All Polls
          </button>
        </div>

      </div>




      <div className="card-body">
        {loading && <p>Loading polls...</p>}
        {error && <p className="text-danger">{error}</p>}
        {/* Active Poll (visible to all) */}
        {!loading && !error && savedPolls.length > 0 && (
          <div>
            {savedPolls.length > 0 && (

              <div>
                {savedPolls.map((poll) => {

                  const userVote = poll?.votedUsers?.find(
                    v => v.userId?.toString() === loggedInUserId?.toString()
                  );

                  return (

                    <div key={poll._id} >
                      <p className="fw-semibold"
                        style={{
                          whiteSpace: "pre-wrap",
                          maxHeight: "50px",
                          overflowY: "auto",
                          wordBreak: "break-word",
                          scrollbarWidth: "thin",

                        }}>{poll.question}</p>

                      {poll.options?.map((opt, idx) => {


                        const votesCount = opt.votes || 0;

                        return (
                          <div key={idx} className="mb-2">
                            <label className="d-flex justify-content-between align-items-center">
                              <div>
                                <input
                                  type="radio"
                                  name={`poll-${poll._id}`}
                                  className="me-2"
                                  checked={userVote?.optionIndex === idx}
                                  disabled={voting || !!userVote || user?.role === "admin"} //rutuja
                                  onChange={() => votePoll(poll._id, idx)}
                                />
                                {opt.text}
                              </div>
                              {user?.role === "admin" ? (
                                <span
                                  className="badge bg-secondary"
                                  style={{
                                    minWidth: "50px",
                                  }}
                                  title="Click to see who voted"
                                >
                                  {votesCount} {votesCount === 1 ? 'vote' : 'votes'}
                                </span>
                              ) : (
                                <span className="badge bg-secondary">
                                  {votesCount} {votesCount === 1 ? 'vote' : 'votes'}
                                </span>
                              )}
                            </label>
                          </div>
                        );
                      })}

                      {voteMessage && (
                        <div className="alert alert-warning py-1 mt-2">
                          {voteMessage}
                        </div>
                      )}
                      {poll.description && <p className="text-muted mt-2"
                        style={{
                          whiteSpace: "pre-wrap",
                          maxHeight: "50px",
                          overflowY: "auto",
                          wordBreak: "break-word",
                          scrollbarWidth: "thin",
                        }}
                      >{poll.description}</p>}

                      {user?.role === "admin" && (
                        <div className="d-flex justify-content-end gap-2 mt-2">

                          <button
                            onClick={() => fetchVotedMembers(poll._id, poll.question, poll.options, "active")}
                            className="btn btn-sm custom-outline-btn d-flex align-items-center gap-1"
                            title="View who voted"
                          >
                            View Votes
                          </button>


                          <button
                            onClick={() => openEditPoll(poll)}
                            className="btn btn-sm custom-outline-btn d-flex align-items-center gap-1"

                            title="Edit Poll"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deletePoll(poll._id)}
                            disabled={deleteLoading}
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"

                            title="Delete Poll"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {user?.role === "admin" && showCreatePoll && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreatePoll(false); // click outside closes modal
          }}
        >
          <div className="modal-dialog"
            style={{
              maxWidth: "650px",
              width: "95%",
              marginTop: "80px",
            }}>
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Create New Poll</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowCreatePoll(false)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body"
                style={{ maxHeight: "60vh" }}>
                <input
                  className="form-control mb-2"
                  placeholder="Enter poll question"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
                {options.map((opt, index) => (
                  <div key={index} className="d-flex mb-2">
                    <input type="radio" disabled className="me-2 mt-2" />
                    <input
                      className="form-control me-2"
                      placeholder={`Option ${index + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    {options.length > 2 && (
                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={() => removeOption(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button
                  className="btn btn-sm custom-outline-btn mb-2"
                  onClick={addOption}
                >
                  + Add Option
                </button>

                {/* <input
                    className="form-control mb-3"
                    placeholder="Enter poll description"
                    value={pollDescription}
                    onChange={(e) => setPollDescription(e.target.value)}
                  /> */}

                <input
                  className="form-control mb-3"
                  placeholder="Enter poll description (max 300 words)"
                  value={pollDescription}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (countWords(value) <= 300) {
                      setPollDescription(value);
                    }
                  }}

                />


                {/* Save & Cancel buttons aligned right */}
                <div className="d-flex justify-content-end gap-2 flex-wrap">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={createPoll}
                  >
                    Save Poll
                  </button>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={() => {
                      setShowCreatePoll(false);
                      setPollQuestion("");
                      setPollDescription("");
                      setOptions(["", ""]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {popupPreviousPolls && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPopupPreviousPolls(null);
            }
          }}
        >
          <div className="modal-dialog"
            style={{
              maxWidth: "650px",
              width: "95%",
              marginTop: "100px",
            }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  Previous Polls Details
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setPopupPreviousPolls(null)}
                />
              </div>

              {/*rutuja replace BODY */}
              <div className="modal-body">
                {previousPolls.length > 0 ? (
                  previousPolls.map((poll) => (
                    <div key={poll._id} className="border rounded p-3 mb-3">

                      {/* <p className="fw-semibold">{poll.question}</p> */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <p className="fw-semibold mb-0" style={{
                          flex: 1,
                          marginRight: "1rem",
                          maxHeight: "80px",
                          overflowY: "auto",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          paddingRight: "10px",
                          scrollbarWidth: "thin",
                        }}>
                          {poll.question}
                        </p>

                        {/* Delete Button only admin */}
                        <div className="d-flex gap-2 align-items-center">
                          {/* View Voters button */}
                          <button
                            className="btn btn-sm custom-outline-btn"
                            style={{
                              minWidth: "100px",
                              whiteSpace: "nowrap",
                              flexShrink: 0
                            }}
                            onClick={() => fetchVotedMembers(poll._id, poll.question, poll.options, "previous")}
                          >
                            View Voters
                          </button>

                          {/* Delete button - admin only */}
                          {user?.role === "admin" && (
                            <button
                              onClick={() => deletePoll(poll._id)}
                              disabled={deleteLoading}
                              className="btn btn-sm btn-outline-danger"
                              title="Delete Poll"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {poll.options.map((opt, idx) => {
                        const userVote = poll?.votedUsers?.find(
                          v => v.userId?.toString() === loggedInUserId?.toString()
                        );

                        return (
                          <div key={idx} className="d-flex justify-content-between mb-1">
                            <label className="d-flex align-items-center">
                              <input
                                type="radio"
                                name={`poll-${poll._id}`}
                                className="me-2"
                                checked={userVote?.optionIndex === idx}
                                disabled={!!userVote || user?.role === "admin" || voting}
                                onChange={() => votePoll(poll._id, idx)}
                              />
                              <span>{opt.text}</span>
                            </label>

                            {user?.role === "admin" ? (
                              <span
                                className="badge bg-secondary"
                                style={{ minWidth: "60px" }}
                              >
                                {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                {opt.votes} {opt.votes === 1 ? 'vote' : 'votes'}
                              </span>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  ))
                ) : (
                  <p className="text-muted text-center">
                    No previous polls found
                  </p>
                )}
              </div>


            </div>
          </div>
        </div>
      )}


      {/* rutuja code start */}
      {showVotedMembers && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowVotedMembers(false)}
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: "700px",
              width: "95%",
              marginTop: "100px",
            }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">
                  Voted Members - {selectedPollQuestion}
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowVotedMembers(false)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {selectedPollVotes.length > 0 ? (
                  <div>
                    {selectedPollVotes.map((optionData, optionIdx) => (
                      <div key={optionIdx} className="mb-4">
                        <div className="d-flex justify-content-between align-items-center bg-light p-2 rounded mb-2">
                          <h6 className="mb-0">
                            Option {optionIdx + 1}: {optionData.optionText}
                          </h6>
                          <span className="badge " style={{ background: "rgba(0,0,0,0.5)" }}  >
                            {optionData.totalVotes} {optionData.totalVotes === 1 ? 'vote' : 'votes'}
                          </span>
                        </div>

                        {optionData.votes.length > 0 ? (
                          <div className="ms-3">
                            {optionData.votes.map((vote, voteIdx) => (
                              <div key={voteIdx} className="mb-2 p-2 ">
                                {voteIdx + 1}. {vote.userName || vote.userId?.name || "Unknown User"}
                                ({vote.userRole || vote.userId?.role || "employee"})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted ms-3">No votes for this option</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted py-4">
                    No votes found for this poll
                  </p>
                )}
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <div className="d-flex justify-content-between align-items-center w-100">
                  <span className="text-muted">
                    Total Voters: {selectedPollVotes.reduce((acc, curr) => acc + curr.totalVotes, 0)}
                  </span>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ width: 90 }}
                    onClick={() => setShowVotedMembers(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.role === "admin" && showEditPoll && editingPoll && (
        <div
          className="modal fade show"
          ref={modalRef}
          tabIndex="-1"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditPoll(false);
          }}
        >
          <div
            className="modal-dialog"
            style={{
              maxWidth: "650px",
              width: "95%",
              marginTop: "80px",
            }}
          >
            <div className="modal-content">
              {/* HEADER */}
              <div
                className="modal-header text-white"
                style={{ backgroundColor: "#3A5FBE" }}
              >
                <h5 className="modal-title mb-0">Edit Poll</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditPoll(false)}
                />
              </div>

              {/* BODY */}
              <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                <input
                  className="form-control mb-2"
                  placeholder="Enter poll question"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                />

                {editOptions.map((opt, index) => (
                  <div key={index} className="d-flex mb-2">
                    <input type="radio" disabled className="me-2 mt-2" />
                    <input
                      className="form-control me-2"
                      placeholder={`Option ${index + 1}`}
                      value={opt.text}
                      onChange={(e) => updateEditOption(index, e.target.value)}
                    />
                    {editOptions.length > 2 && (
                      <button
                        className="btn btn-sm custom-outline-btn"
                        onClick={() => removeEditOption(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button
                  className="btn btn-sm custom-outline-btn mb-2"
                  onClick={addEditOption}
                >
                  + Add Option
                </button>

                <input
                  className="form-control mb-3"
                  placeholder="Enter poll description (max 300 words)"
                  value={editDescription}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (countWords(value) <= 300) {
                      setEditDescription(value);
                    }
                  }}
                />

                {/* Save & Cancel buttons aligned right */}
                <div className="d-flex justify-content-end gap-2 flex-wrap">
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={editPoll}
                  >
                    Update Poll
                  </button>
                  <button
                    className="btn btn-sm custom-outline-btn"
                    style={{ minWidth: 90 }}
                    onClick={() => {
                      setShowEditPoll(false);
                      setEditingPoll(null);
                      setEditQuestion("");
                      setEditDescription("");
                      setEditOptions([]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default ActivePolls;



