import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import userData from "../services/userServices";
import toast from "react-hot-toast";

export default function Profile() {
    const location = useLocation();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(true);

    /* ✅ Load user on page load */
    useEffect(() => {
        let storedUser = null;

        if (location.state?.user) {
            storedUser = location.state.user;
            localStorage.setItem("user", JSON.stringify(storedUser));
        } else if (localStorage.getItem("user")) {
            storedUser = JSON.parse(localStorage.getItem("user"));
        }

        if (!storedUser) {
            navigate("/");
            return;
        }

        setUser(storedUser);
        setBio(storedUser.bio || "");
        setLoading(false);
    }, [location.state, navigate]);

    /* ✅ Avatar source */
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    let avatarSrc = "";

    if (user?.avatar?.data) {
        avatarSrc = `${backendUrl}/user/avatar/${user._id}?t=${Date.now()}`; // Cache busting with timestamp to ensure updated avatar is fetched (a query param is added to the URL which makes the browser think it's a new resource)
    } else if (user) {
        avatarSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent( //// encodeURIComponent is used to encode special characters such as spaces in the username which could break the URL
            user.username || "User"
        )}&background=0D8ABC&color=fff&size=128`;
    }
    console.log("Avatar Source:", avatarSrc);

    /* ✅ Submit updated profile */
    const handleUserData = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();
            formData.append("_id", user._id);
            formData.append("bio", bio);
            if (avatar) formData.append("avatar", avatar);

            const res = await userData(formData);

            toast.success(res.data.message);

            if (res.data.user) {
                setUser(res.data.user);
                setBio(res.data.user.bio || "");
                localStorage.setItem("user", JSON.stringify(res.data.user));
                setAvatar(null);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Update failed");
        }
    };

    /* ✅ Loading UI */
    if (loading || !user) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-700">
                <p>Loading User...</p>
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif"
                    alt="loading"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-sky-100 to-white p-6">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 sm:p-8">

                    {/* HEADER */}
                    <div className="sm:flex items-center gap-6 relative">

                        <div>
                            {/* Avatar */}
                            <img
                                src={avatarSrc}
                                alt="avatar"
                                className="w-28 h-28 mx-auto rounded-full object-cover border-4 border-white shadow-md"
                            />

                            {/* Avatar upload */}
                            <form encType="multipart/form-data" className="absolute top-20 left-20">
                                <label
                                    htmlFor="fileInput"
                                    className="cursor-pointer bg-sky-100 hover:bg-sky-200 px-2 py-1 rounded"
                                >
                                    <i className="bx bx-image-landscape"></i>
                                </label>
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept="image/jpg, image/jpeg, image/png"
                                    className="hidden"
                                    onChange={(e) => setAvatar(e.target.files[0])}
                                />
                            </form>
                        </div>
                        <div>
                            {/* User info */}
                            <h1 className="text-2xl font-semibold text-gray-800">
                                {user.username}
                            </h1>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <button
                                onClick={() => navigate(-1)}
                                className="mt-3 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                            >
                                Back
                            </button>
                        </div>
                    </div>

                    {/* BIO */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                            className="mt-2 w-full min-h-[120px] p-3 border border-neutral-500 rounded-lg text-neutral-700 focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                            placeholder="Tell us about yourself..."
                            value={bio}
                            maxLength={200}
                            onChange={(e) => setBio(e.target.value)}
                        />
                        <div className={`text-right text-xs mt-1 ${bio.length === 200 ? "text-red-500" : "text-gray-500"
                            }`}>
                            {200 - bio.length} characters left
                        </div>
                    </div>

                    {/* UPDATE BUTTON */}
                    <button
                        onClick={handleUserData}
                        className="mt-6 w-full py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 hover:cursor-pointer transition"
                    >
                        Update Profile
                    </button>

                </div>
            </div>
        </div>
    );
}
