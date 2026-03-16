import React, {useEffect, useMemo, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message} from "antd";
import dayjs from "dayjs";
import AppShell from "../Components/AppShell";
import {
    createTransaction,
    deleteTransaction,
    getTransactions,
    updateTransaction,
} from "../redux/slices/transactionSlice";
import {getCategories} from "../redux/slices/categorySlice";

const Transactions = () => {
    const dispatch = useDispatch();
    const {transactions, loading} = useSelector((state) => state.transactions);
    const {categories} = useSelector((state) => state.categories);
    const [form] = Form.useForm();
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState("");

    useEffect(() => {
        dispatch(getCategories());
    }, [dispatch]);

    useEffect(() => {
        dispatch(getTransactions(typeFilter ? {type: typeFilter} : {}));
    }, [dispatch, typeFilter]);

    const categoryOptions = useMemo(() => categories.map((cat) => ({label: cat.name, value: cat.name})), [categories]);

    const openCreateModal = () => {
        setEditingTransaction(null);
        form.resetFields();
        form.setFieldsValue({type: "expense", paymentMethod: "other", date: dayjs()});
        setIsModalOpen(true);
    };

    const openEditModal = (record) => {
        setEditingTransaction(record);
        form.setFieldsValue({
            ...record,
            date: dayjs(record.date),
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
        form.resetFields();
    };

    const onSubmit = async (values) => {
        const payload = {
            ...values,
            date: values.date.toISOString(),
        };

        try {
            if (editingTransaction) {
                await dispatch(updateTransaction({id: editingTransaction._id, data: payload})).unwrap();
                message.success("Transaction updated");
            } else {
                await dispatch(createTransaction(payload)).unwrap();
                message.success("Transaction created");
            }
            closeModal();
            dispatch(getTransactions(typeFilter ? {type: typeFilter} : {}));
        } catch (error) {
            message.error(error || "Failed to save transaction");
        }
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteTransaction(id)).unwrap();
            message.success("Transaction deleted");
        } catch (error) {
            message.error(error || "Failed to delete transaction");
        }
    };

    const columns = [
        {
            title: "Date",
            dataIndex: "date",
            key: "date",
            render: (value) => new Date(value).toLocaleDateString(),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            render: (value) => <Tag color={value === "income" ? "green" : "red"}>{value.toUpperCase()}</Tag>,
        },
        {
            title: "Category",
            dataIndex: "category",
            key: "category",
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            render: (value) => value || "N/A",
        },
        {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            align: "right",
            render: (value) => `Rs ${Number(value).toLocaleString()}`,
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space>
                    <Button size="small" onClick={() => openEditModal(record)}>
                        Edit
                    </Button>
                    <Button size="small" danger onClick={() => handleDelete(record._id)}>
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <AppShell title="Transactions">
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <Space wrap>
                    <Button type="primary" onClick={openCreateModal}>
                        Add Transaction
                    </Button>
                    <Select
                        style={{minWidth: 180}}
                        allowClear
                        placeholder="Filter by type"
                        value={typeFilter || undefined}
                        onChange={(value) => setTypeFilter(value || "")}
                        options={[
                            {label: "Income", value: "income"},
                            {label: "Expense", value: "expense"},
                        ]}
                    />
                </Space>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <Table rowKey="_id" columns={columns} dataSource={transactions} loading={loading} pagination={false} />
            </div>

            <Modal
                title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
                open={isModalOpen}
                onCancel={closeModal}
                onOk={() => form.submit()}
                okText={editingTransaction ? "Update" : "Create"}
            >
                <Form form={form} layout="vertical" onFinish={onSubmit}>
                    <Form.Item name="type" label="Type" rules={[{required: true}]}>
                        <Select
                            options={[
                                {label: "Income", value: "income"},
                                {label: "Expense", value: "expense"},
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="category" label="Category" rules={[{required: true}]}>
                        <Select showSearch options={categoryOptions} placeholder="Select category" />
                    </Form.Item>
                    <Form.Item name="amount" label="Amount" rules={[{required: true}]}>
                        <InputNumber min={0.01} precision={2} style={{width: "100%"}} />
                    </Form.Item>
                    <Form.Item name="date" label="Date" rules={[{required: true}]}>
                        <DatePicker style={{width: "100%"}} />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input />
                    </Form.Item>
                    <Form.Item name="paymentMethod" label="Payment Method">
                        <Select
                            options={[
                                {label: "Cash", value: "cash"},
                                {label: "Credit Card", value: "credit_card"},
                                {label: "Debit Card", value: "debit_card"},
                                {label: "Bank Transfer", value: "bank_transfer"},
                                {label: "Digital Wallet", value: "digital_wallet"},
                                {label: "Other", value: "other"},
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </AppShell>
    );
};

export default Transactions;
