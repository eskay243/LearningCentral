import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StudentProgressItem } from "@/types";
import { getInitials } from "@/lib/utils";

interface StudentProgressProps {
  students: StudentProgressItem[];
  isLoading?: boolean;
}

const StudentProgress = ({ students, isLoading = false }: StudentProgressProps) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow">
        <div className="p-4 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading student progress...</p>
        </div>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-500">Top Students by Progress</div>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500">No student data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="text-sm font-medium text-gray-500">Top Students by Progress</div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {students.map((student) => (
          <div key={student.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-10 w-10">
                <AvatarImage src={student.avatar} alt={student.name} />
                <AvatarFallback className="bg-gray-200">
                  {getInitials(student.name)}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-dark-800">{student.name}</p>
                <p className="text-sm text-gray-500">{student.course}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-dark-800">{student.progress}%</span>
              <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                <div 
                  className="h-2 bg-primary-500 rounded-full" 
                  style={{ width: `${student.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 text-right border-t border-gray-200">
        <a href="/students" className="text-sm font-medium text-primary-600 hover:text-primary-700">View All Students</a>
      </div>
    </div>
  );
};

export default StudentProgress;
