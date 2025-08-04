const MemberAvatars = ({ members, totalMembers, onClick }) => {
  return (
    <div className="flex items-center -space-x-2 cursor-pointer" onClick={onClick}>
      {members.slice(0, 3).map((member, index) => (
        <div key={member.user._id} className="relative">
          {member.user.avatar ? (
            <img
              src={member.user.avatar}
              alt={member.user.name}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800">
              {member.user.name.charAt(0)}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        </div>
      ))}
      {totalMembers > 3 && (
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
          +{totalMembers - 3}
        </div>
      )}
    </div>
  );
};

export default MemberAvatars;