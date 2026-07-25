"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Trash2, Plus, ShieldCheck, Mail, ShieldAlert } from "lucide-react";

export default function AdminWhitelistPage() {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MASTER_EMAILS = [
    "muhammadaliuktamov42@gmail.com",
    "fieryscorpion259@gmail.com"
  ];

  const isMaster = session?.user?.email && MASTER_EMAILS.includes(session.user.email);

  useEffect(() => {
    if (isMaster) fetchEmails();
  }, [isMaster]);

  const fetchEmails = async () => {
    try {
      const res = await fetch("/api/whitelist");
      if (res.ok) {
        const data = await res.json();
        setEmails(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setNewEmail("");
      fetchEmails();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatdan ham bu odamdan ruxsatni olib tashlaysizmi?")) return;
    
    try {
      await fetch(`/api/whitelist?id=${id}`, { method: "DELETE" });
      fetchEmails();
    } catch (e) {
      console.error(e);
    }
  };

  if (!isMaster) {
    return (
      <div className="p-8 text-center flex flex-col items-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Kirish taqiqlangan!</h1>
        <p className="text-gray-400">Sizda boshqa odamlarga ruxsat berish huquqi yo'q. Faqatgina Asosiy Admin buni qila oladi.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ShieldCheck className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold">Xavfsizlik & Ruxsatnomalar</h1>
      </div>

      <div className="bg-[#1c1c20] p-6 rounded-xl border border-white/5 mb-8">
        <h2 className="text-xl font-semibold mb-4">Yangi foydalanuvchiga ruxsat berish</h2>
        <form onSubmit={handleAdd} className="flex gap-4">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Foydalanuvchining Gmail pochtasi..."
              className="w-full bg-[#131316] border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {loading ? "Qo'shilmoqda..." : "Ruxsat berish"}
          </button>
        </form>
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
      </div>

      <div className="bg-[#1c1c20] rounded-xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#212126]">
          <h2 className="text-lg font-semibold">Ruxsat berilganlar ro'yxati (Whitelist)</h2>
          <span className="text-sm text-gray-400">Jami: {emails.length} ta</span>
        </div>
        
        {emails.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Hozircha hech kimga ruxsat berilmagan.
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {emails.map((item) => (
              <li key={item.id} className="p-4 px-6 flex justify-between items-center hover:bg-white/5 transition-colors">
                <div>
                  <p className="font-medium">{item.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Qo'shildi: {new Date(item.createdAt).toLocaleDateString()} | Kim tomonidan: {item.addedBy}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  title="Ruxsatni olib tashlash"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
