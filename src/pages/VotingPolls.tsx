export function VotingPolls() {
  return (
    <div>
      <h2 className="mb-4">Voting & Polls</h2>
      <p className="lead">Create and participate in organizational polls and voting.</p>
      <div className="row g-4 mt-3">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Office Renovation Options</h5>
              <p className="card-text text-muted">Closes in 2 days</p>
              <div className="mb-3">
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="renovation" id="option1" />
                  <label className="form-check-label" htmlFor="option1">
                    Modern minimalist design
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="renovation" id="option2" />
                  <label className="form-check-label" htmlFor="option2">
                    Traditional corporate style
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="renovation" id="option3" />
                  <label className="form-check-label" htmlFor="option3">
                    Eco-friendly workspace
                  </label>
                </div>
              </div>
              <button className="btn btn-primary">Submit Vote</button>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Team Building Activity</h5>
              <p className="card-text text-muted">Closes in 5 days</p>
              <div className="mb-3">
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="activity" id="activity1" />
                  <label className="form-check-label" htmlFor="activity1">
                    Outdoor adventure
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="activity" id="activity2" />
                  <label className="form-check-label" htmlFor="activity2">
                    Cooking workshop
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="radio" name="activity" id="activity3" />
                  <label className="form-check-label" htmlFor="activity3">
                    Escape room challenge
                  </label>
                </div>
              </div>
              <button className="btn btn-primary">Submit Vote</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
