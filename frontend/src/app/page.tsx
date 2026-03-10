import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-5xl font-bold text-indigo-700">Admin App</h1>
        <p className="text-lg text-gray-600">
          A secure business administration platform to manage your employees and inventory in one place.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/login" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition">
            Sign In
          </Link>
          <Link href="/register" className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition">
            Create Account
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-8 text-left">
          {[
            { icon: '👥', title: 'Employees', desc: 'Manage your workforce with full CRUD operations.' },
            { icon: '📦', title: 'Inventory', desc: 'Track stock levels, prices, and product details.' },
            { icon: '🔐', title: 'Secure Access', desc: 'Role-based permissions — admin & viewer roles.' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-800">{f.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
