import React from "react";
import Modal from 'react-bootstrap/Modal';
import { Button } from 'react-bootstrap';

class MessageModal extends React.Component {
    constructor( props ){
        super(props);        
    }

    onClose = () => {
        this.props.onClose(false)
    }  

    render( ) {
        return (
            <Modal show={this.props.show} >
                <Modal.Header>
                    <Modal.Title>{ this.props.title }</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {this.props.message}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={this.onClose}>
                        Close
                    </Button>                    
                </Modal.Footer>
            </Modal>
        );
    }
};

export default MessageModal;