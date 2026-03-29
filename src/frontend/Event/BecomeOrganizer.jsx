import { useState } from "react";
import { apiUrl } from "../../lib/api";
import { useAuthModal } from "../../App";
import { useNavigate } from "react-router-dom";

export default function BecomeOrganizer() {

  const { token } = useAuthModal();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    birth_date: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    subdistrict: "",
    national_id: "",
    organization_name: "",
    description: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(apiUrl("/organizers/register"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      alert("✅ Registration successful! You can now create events immediately.");
      navigate("/my-events");

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-10 max-w-[600px] mx-auto">

      <h1 className="text-xl mb-6">Become Organizer</h1>

      <form onSubmit={handleSubmit} className="grid gap-4">

        <input name="first_name" placeholder="First Name" onChange={handleChange} />
        <input name="last_name" placeholder="Last Name" onChange={handleChange} />

        <input type="date" name="birth_date" onChange={handleChange} />

        <input name="phone" placeholder="Phone" onChange={handleChange} />

        <textarea name="address" placeholder="Address" onChange={handleChange} />

        <input name="province" placeholder="Province" onChange={handleChange} />
        <input name="district" placeholder="District" onChange={handleChange} />
        <input name="subdistrict" placeholder="Subdistrict" onChange={handleChange} />

        <input name="national_id" placeholder="National ID" onChange={handleChange} />

        <input name="organization_name" placeholder="Organization Name" onChange={handleChange} />

        <textarea name="description" placeholder="Description" onChange={handleChange} />

        <button className="bg-[#6f8b5d] text-white py-2 rounded">
          Submit
        </button>

      </form>

    </div>
  );
}