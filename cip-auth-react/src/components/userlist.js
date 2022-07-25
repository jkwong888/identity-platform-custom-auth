import React, { useEffect, useState, useCallback, memo }  from 'react';
import { useService } from '../context/service';
import memoize from 'memoize-one';
import { FixedSizeList as List, areEqual } from 'react-window';
import { withRouter } from 'react-router-dom';

const createItemData = memoize((items, selectedUid, toggleItemActive) => ({
    items,
    selectedUid,
    toggleItemActive,
    }));

const User = memo(({data, index, style}) => {
    const { items, selectedUid, toggleItemActive } = data;
    const { uid, email } = items[index];

    return ( 
        <div 
            style={style}
            className={ selectedUid == uid ? "ListItemSelected" : index % 2 ? "ListItemOdd" : "ListItemEven"}
            key={uid}
            onClick = {() => toggleItemActive(uid)}
            >
            {email}
        </div>
    );
}, areEqual);

function UserListBase(props) {
    const service = useService();
    const [userListData, setUserListData] = useState({
        users: [], 
        selectedUid: null,
        error: null
    });


    const getUserList = useCallback(() => {
        service.getUserList()
            .then((response, err) => {
                console.log(response);
                setUserListData({
                    users: response, 
                    selectedUid: null,
                    error: null
                });
            }).catch((error) => {
                console.log(error);
                setUserListData({
                    users: [], 
                    selectedUid: null,
                    error: error,
                });
            });;

    }, [service]);

    useEffect(() => {
        getUserList();

        return function cleanup() {
            setUserListData({
                users: [], 
                selectedUid: null,
                error: null
            })
        }
    }, [getUserList]);


    const itemKey = (index, userData) => {
        const { items, selectedUid, toggleItemActive } = userData;
        const item = items[index];
        return item.uid;
    };

    function selectUser(uid) {
        console.log("selected user is now: " + uid);
        setUserListData({
            users: userListData.users,
            selectedUid: uid,
            error: null,
        })
    }

    const userList = createItemData(userListData.users, userListData.selectedUid, selectUser);

    return (
        <div align="center">
            <div>
                <h3>UserList</h3>
            </div>
            <div>
                <List
                    className="List"
                    itemKey={itemKey}
                    itemData={userList}
                    innerElementType="ul"
                    height={450}
                    itemSize={35}
                    width={400}
                    itemCount={userListData.users.length}
                >
                    {User}
                </List>
            </div>
        </div>
    );
}
const UserList = withRouter(UserListBase);

export default UserList;