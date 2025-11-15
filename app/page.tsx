import ImageEditor from "@/components/ImageEditor";

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <ImageEditor />
        </div>
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-medium mb-2">Tips</h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>Upload a PNG or JPEG</li>
              <li>Use Remove Background for people photos</li>
              <li>Export transparent PNGs for web</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <h2 className="font-medium mb-2">AI Enhance (Optional)</h2>
            <p className="text-sm text-gray-600">
              Configure <code>OPENAI_API_KEY</code> on Vercel to enable server-side
              AI enhancement.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
